import bcrypt from 'bcrypt';
import prisma from "../../../shared/prisma";
import ApiError from '../../../errors/apiError';
import httpStatus from 'http-status';
import { JwtHelper } from '../../../helpers/jwtHelper';
import config from '../../../config';
import { Secret } from 'jsonwebtoken';
import moment from 'moment';
import { EmailtTransporter } from '../../../helpers/emailTransporter';
const { v4: uuidv4 } = require('uuid');
import * as path from 'path';

type ILoginResponse = {
  accessToken?: string;
  user: {};
};

const loginUser = async (user: any): Promise<ILoginResponse> => {
  const { email: IEmail, password } = user;

  const isUserExist = await prisma.auth.findUnique({
    where: { email: IEmail }
  });

  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist!");
  }

  const isPasswordMatched = await bcrypt.compare(password, isUserExist.password);

  if (!isPasswordMatched) {
    throw new ApiError(httpStatus.NOT_FOUND, "Password is not matched!");
  }

  const { role, userId, isDemo, email } = isUserExist;

  const accessToken = JwtHelper.createToken(
    { role, userId, email, isDemo: role === 'admin' ? Boolean(isDemo) : false },
    config.jwt.secret as Secret,
    config.jwt.JWT_EXPIRES_IN as string
  );

  return {
    accessToken,
    user: {
      role,
      userId,
      email,
      isDemo: role === 'admin' ? Boolean(isDemo) : false
    }
  };
};

const VerificationUser = async (user: any): Promise<ILoginResponse> => {
  const { email: IEmail, password } = user;

  const isUserExist = await prisma.auth.findUnique({
    where: { email: IEmail }
  });

  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist!");
  }

  const isPasswordMatched = await bcrypt.compare(password, isUserExist.password);

  if (!isPasswordMatched) {
    throw new ApiError(httpStatus.NOT_FOUND, "Password is not matched!");
  }

  const { role, userId, isDemo, email } = isUserExist;

  const accessToken = JwtHelper.createToken(
    { role, userId, email, isDemo: role === 'admin' ? Boolean(isDemo) : false },
    config.jwt.secret as Secret,
    config.jwt.JWT_EXPIRES_IN as string
  );

  return {
    accessToken,
    user: {
      role,
      userId,
      email,
      isDemo: role === 'admin' ? Boolean(isDemo) : false
    }
  };
};

const resetPassword = async (payload: any): Promise<{ message: string }> => {
  const { email } = payload;

  const isUserExist = await prisma.auth.findUnique({
    where: { email }
  });

  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist!");
  }

  const clientUrl = `${config.clientUrl}/reset-password/`;
  const uniqueString = uuidv4() + isUserExist.id;
  const uniqueStringHashed = bcrypt.hashSync(uniqueString, 12);
  const encodedUniqueStringHashed = uniqueStringHashed.replace(/\//g, '-');

  const resetLink = clientUrl + isUserExist.id + '/' + encodedUniqueStringHashed;
  const currentTime = moment();
  const expiresTime = moment(currentTime).add(4, 'hours');

  await prisma.$transaction(async (tx) => {
    const existingForgotPassword = await tx.forgotPassword.findUnique({
      where: { id: isUserExist.id }
    });

    if (existingForgotPassword) {
      await tx.forgotPassword.delete({
        where: { id: isUserExist.id }
      });
    }

    const forgotPassword = await tx.forgotPassword.create({
      data: {
        userId: isUserExist.id,
        expiresAt: expiresTime.toDate(),
        uniqueString: resetLink
      }
    });

    if (forgotPassword) {
      const pathName = path.join(__dirname, '../../../../template/resetPassword.html');
      const obj = { link: resetLink };
      const subject = "Request to Reset Password";
      const toMail = isUserExist.email;

      try {
        await EmailtTransporter({ pathName, replacementObj: obj, toMail, subject });
      } catch (error) {
        console.log("Email sending failed, skipping...");
        // Not throwing error so server doesn't crash
      }
    }

    return forgotPassword;
  });

  return {
    message: "Password reset successfully!"
  };
};

const PassworResetConfirm = async (payload: any): Promise<any> => {
  const { userId, uniqueString, password } = payload;

  await prisma.$transaction(async (tx) => {
    const isUserExist = await tx.auth.findUnique({
      where: { id: userId }
    });

    if (!isUserExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "User does not exist!");
    }

    const resetLink = `${config.clientUrl}/reset-password/${isUserExist.id}/${uniqueString}`;

    const getForgotRequest = await tx.forgotPassword.findFirst({
      where: {
        userId: userId as string,
        uniqueString: resetLink
      }
    });

    if (!getForgotRequest) {
      throw new ApiError(httpStatus.NOT_FOUND, "Forgot request was not found or invalid!");
    }

    const expiresAt = moment(getForgotRequest.expiresAt);
    const currentTime = moment();

    if (expiresAt.isBefore(currentTime)) {
      throw new ApiError(httpStatus.NOT_FOUND, "Forgot request has expired!");
    }

    await tx.auth.update({
      where: { id: userId },
      data: {
        password: password ? bcrypt.hashSync(password, 12) : undefined
      }
    });

    await tx.forgotPassword.delete({
      where: { id: getForgotRequest.id }
    });
  });

  return {
    message: "Password changed successfully!"
  };
};

export const AuthService = {
  loginUser,
  VerificationUser,
  resetPassword,
  PassworResetConfirm
};