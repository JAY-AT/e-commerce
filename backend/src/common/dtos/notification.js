// Trace point: publicUserDTO()
export const publicUserDTO = (user) => ({
  id: user.id,
  email: user.email,
  first_name: user.first_name,
  last_name: user.last_name,
  phone: user.phone ?? null,
  address_line: user.address_line ?? null,
  city: user.city ?? null,
  state: user.state ?? null,
  postal_code: user.postal_code ?? null,
  role: user.role ?? "customer"
});


export const createNotifFormat = ({
  user_id = null,
  type,
  target_role,
  message,
}) => {
  return {
    user_id: user_id,
    target_role: target_role,
    type: type,
    message: message,
  };
};