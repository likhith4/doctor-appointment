import React, { useEffect, useState } from 'react';
import { FaCheck, FaEnvelope, FaLock, FaTimes, FaUser } from 'react-icons/fa';
import SocialSignUp from './SocialSignUp';
import Spinner from 'react-bootstrap/Spinner';
import swal from 'sweetalert';
import { useDoctorSignUpMutation, usePatientSignUpMutation } from '../../redux/api/authApi';
import { message } from 'antd';

const SignUp = ({ setSignUp }) => {
  const formField = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  };

  const [user, setUser] = useState(formField);
  const [userType, setUserType] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [infoError, setInfoError] = useState('');

  const [doctorSignUp, { isSuccess: dIsSuccess, isError: dIsError, error: dError }] = useDoctorSignUpMutation();
  const [patientSignUp, { isSuccess: pIsSuccess, isError: pIsError, error: pError }] = usePatientSignUpMutation();

  const [passwordValidation, setPasswordValidation] = useState({
    carLength: false,
    specailChar: false,
    upperLowerCase: false,
    numeric: false
  });

  const [emailError, setEmailError] = useState({
    emailError: false
  });

  const handleSignUpSuccess = () => {
    setLoading(false);
    setUser(formField);
    setSignUp(false);

    swal({
      icon: 'success',
      text: `Successfully ${userType === 'doctor' ? 'Doctor' : 'Patient'} account created. Please login.`,
      timer: 2000
    });
  };

  useEffect(() => {
    if (dIsError && dError) {
      message.error("Email already exists!");
      setLoading(false);
    }

    if (pIsError && pError) {
      message.error("Email already exists!");
      setLoading(false);
    }

    if (dIsSuccess) {
      handleSignUpSuccess();
    }

    if (pIsSuccess) {
      handleSignUpSuccess();
    }
  }, [dIsError, dError, dIsSuccess, pIsError, pError, pIsSuccess]);

  const handleEmailError = (name, value) => {
    if (name === 'email') {
      setEmailError({
        emailError: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      });
    }
  };

  const hanldeValidation = (name, value) => {
    if (name === 'password') {
      setPasswordValidation({
        carLength: value.length >= 8,
        specailChar: /[ `!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(value),
        upperLowerCase: /^(?=.*[a-z])(?=.*[A-Z])/.test(value),
        numeric: /^(?=.*\d)/.test(value),
      });
    }
  };

  const hanldeOnChange = (e) => {
    const { name, value } = e.target;

    hanldeValidation(name, value);
    handleEmailError(name, value);

    setUser((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserTypeChange = (e) => {
    setUserType(e.target.value);
  };

  const hanldeOnSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (userType === "doctor") {
      doctorSignUp(user);
    } else {
      patientSignUp(user);
    }
  };

  return (
    <form className="sign-up-form" onSubmit={hanldeOnSubmit}>
      <div className="alert alert-warning small text-start mb-3" role="alert">
        <strong>Fair use:</strong> Do not misuse this app or create accounts you do not need.
        Patient and doctor sign-up both use email + password only.
        Admin accounts are not created here — they are added in the database with <code>role = admin</code>.
        For a public demo admin, set <code>isDemo = true</code> so the account stays read-only.
      </div>

      <h2 className="title">Sign Up</h2>

      <div className="input-field">
        <span className="fIcon"><FaUser /></span>
        <input
          placeholder="First Name"
          name="firstName"
          type="text"
          onChange={hanldeOnChange}
          value={user.firstName}
        />
      </div>

      <div className="input-field">
        <span className="fIcon"><FaUser /></span>
        <input
          placeholder="Last Name"
          name="lastName"
          type="text"
          onChange={hanldeOnChange}
          value={user.lastName}
        />
      </div>

      <div className="input-field">
        <span className="fIcon"><FaEnvelope /></span>
        <input
          placeholder="Email"
          name="email"
          type="email"
          onChange={hanldeOnChange}
          value={user.email}
        />
      </div>

      <div className="input-field">
        <span className="fIcon"><FaLock /></span>
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={hanldeOnChange}
          value={user.password}
        />
      </div>

      <div className='input-field d-flex align-items-center gap-2 justify-content-center'>
        <div className='text-nowrap'>I'M A</div>
        <select
          className="form-select w-50"
          aria-label="select"
          onChange={handleUserTypeChange}
          value={userType}
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>
      </div>

      {infoError && <h6 className="text-danger text-center">{infoError}</h6>}

      <button
        type="submit"
        className="btn btn-primary btn-block mt-2 iBtn"
        disabled={
          !(passwordValidation.carLength &&
            passwordValidation.numeric &&
            passwordValidation.upperLowerCase &&
            passwordValidation.specailChar &&
            emailError.emailError)
        }
      >
        {loading ? <Spinner animation="border" variant="info" /> : "Sign Up"}
      </button>

      <div className="password-validatity mx-auto">
        <div style={emailError.emailError ? { color: "green" } : { color: "red" }}>
          <p>{emailError.emailError ? <FaCheck /> : <FaTimes />}
            <span className="ms-2">Must have valid email.</span>
          </p>
        </div>

        <div style={passwordValidation.carLength ? { color: "green" } : { color: "red" }}>
          <p>{passwordValidation.carLength ? <FaCheck /> : <FaTimes />}
            <span className="ms-2">Password must have at least 8 characters.</span>
          </p>
        </div>

        <div style={passwordValidation.specailChar ? { color: "green" } : { color: "red" }}>
          <p>{passwordValidation.specailChar ? <FaCheck /> : <FaTimes />}
            <span className="ms-2">Password must have a special character.</span>
          </p>
        </div>

        <div style={passwordValidation.upperLowerCase ? { color: "green" } : { color: "red" }}>
          <p>{passwordValidation.upperLowerCase ? <FaCheck /> : <FaTimes />}
            <span className="ms-2">Password must have uppercase and lowercase letters.</span>
          </p>
        </div>

        <div style={passwordValidation.numeric ? { color: "green" } : { color: "red" }}>
          <p>{passwordValidation.numeric ? <FaCheck /> : <FaTimes />}
            <span className="ms-2">Password must have a number.</span>
          </p>
        </div>
      </div>

      <p className="social-text">Or Sign up with social account</p>
      <SocialSignUp />
    </form>
  );
};

export default SignUp;