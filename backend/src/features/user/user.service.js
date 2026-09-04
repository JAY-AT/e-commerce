import UserModel from "./user.repository.js";
import AddressRepository from "../address/address.repository.js";
import { withTransaction } from "../../common/utilities/handler.js";
import AppError from "../../common/utilities/error.js";
import { hashPassword } from "../../common/utilities/auth.js";

// Trace point: splitProfilePayload()
function splitProfilePayload(data) {
  const userData = {};
  const addressData = {};

  for (const [key, value] of Object.entries(data || {})) {
    if (["first_name", "last_name", "email", "password", "role", "phone"].includes(key)) {
      if (key === "password") {
        userData.password_hash = hashPassword(value);
      } else {
        userData[key] = value;
      }
      continue;
    }

    if (["address_line", "city", "state", "postal_code"].includes(key)) {
      addressData[key] = value;
    }
  }

  return { userData, addressData };
}

// Trace point: getAllUsers()
export const getAllUsers = async () => {
  return await UserModel.findAllWithProfile();
};

// Trace point: getUser()
export const getUser = async (id) => {
  const user = await UserModel.findByIdWithProfile(id);

  if (!user) throw new Error("User not found");

  return user;
};

// Trace point: updateUser()
export const updateUser = async (id, data) => {
  const { userData, addressData } = splitProfilePayload(data);

  if (Object.keys(userData).length === 0 && Object.keys(addressData).length === 0) {
    throw new AppError("No fields provided", 400);
  }

  return withTransaction(UserModel.pool, async (conn) => {
    if (Object.keys(userData).length > 0) {
      const updatedUser = await UserModel.updateById(id, userData, conn);

      if (!updatedUser) {
        throw new Error("User not found");
      }
    }

    if (Object.keys(addressData).length > 0) {
      const addressPayload = {
        address_line: addressData.address_line ?? null,
        city: addressData.city ?? null,
        state: addressData.state ?? null,
        postal_code: addressData.postal_code ?? null,
      };

      await AddressRepository.upsertByUserId(id, addressPayload, conn);
    }

    const updatedProfile = await UserModel.findByIdWithProfile(id, conn);
    if (!updatedProfile) {
      throw new Error("User not found");
    }

    return updatedProfile;
  });
};

// Trace point: deleteUser()
export const deleteUser = async (id) => {
  const result = await UserModel.delete(id);
  return result;
};
