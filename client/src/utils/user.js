export const getRoutePath = (user) => {
  if (user.type === "admin" || user.type === "super_admin") {
    return "/orgs";
  }

  return "/scenarios/" + user._id
};