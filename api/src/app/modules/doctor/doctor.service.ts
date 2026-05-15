import { UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import bcrypt from 'bcrypt';
import ApiError from '../../../errors/apiError';
import httpStatus from 'http-status';
import { DoctorSearchableFields } from "./doctor.interface";
import paginationHelper from "../../../shared/paginationHelper";
import { CloudinaryHelper } from "../../../helpers/uploadHelper";

const create = async (payload: any): Promise<any> => {
  const data = await prisma.$transaction(async (tx) => {
    const { password, ...othersData } = payload;

    const existEmail = await tx.auth.findUnique({
      where: { email: othersData.email }
    });

    if (existEmail) {
      throw new Error("Email Already Exist !!");
    }

    const doctor = await tx.doctor.create({
      data: othersData
    });

    await tx.auth.create({
      data: {
        email: doctor.email,
        password: password ? bcrypt.hashSync(password, 12) : '',
        role: UserRole.doctor,
        userId: doctor.id
      },
    });

    return doctor;
  });

  return data;
};

const getAllDoctors = async (filters: any, options: any): Promise<any> => {
  const { limit, page, skip } = paginationHelper(options);
  const { searchTerm, max, min, specialist, ...filterData } = filters;

  const andCondition: any[] = [];

  if (searchTerm) {
    andCondition.push({
      OR: DoctorSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      }))
    });
  }

  if (Object.keys(filterData).length > 0) {
    andCondition.push({
      AND: Object.entries(filterData).map(([key, value]) => ({
        [key]: { equals: value }
      }))
    });
  }

  if (min || max) {
    andCondition.push({
      AND: {
        price: {
          gte: min,
          lte: max
        }
      }
    });
  }

  if (specialist) {
    andCondition.push({
      AND: {
        services: {
          contains: specialist
        }
      }
    });
  }

  const whereCondition = andCondition.length > 0 ? { AND: andCondition } : {};

  const result = await prisma.doctor.findMany({
    skip,
    take: limit,
    where: whereCondition,
  });

  const total = await prisma.doctor.count({
    where: whereCondition
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result
  };
};

const getDoctor = async (id: string): Promise<any> => {
  const result = await prisma.doctor.findUnique({
    where: { id }
  });

  return result;
};

const deleteDoctor = async (id: string): Promise<any> => {
  const result = await prisma.$transaction(async (tx) => {
    const doctor = await tx.doctor.delete({
      where: { id }
    });

    await tx.auth.delete({
      where: { email: doctor.email }
    });

    return doctor;
  });

  return result;
};

const updateDoctor = async (req: any): Promise<any> => {
  const file = req.file;
  const id = req.params.id;
  const user = JSON.parse(req.body.data);

  if (file) {
    const uploadImage = await CloudinaryHelper.uploadFile(file);

    if (uploadImage) {
      user.img = uploadImage.secure_url;
    } else {
      throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Failed to Upload Image');
    }
  }

  const result = await prisma.doctor.update({
    where: { id },
    data: user
  });

  return result;
};

export const DoctorService = {
  create,
  updateDoctor,
  deleteDoctor,
  getAllDoctors,
  getDoctor
};