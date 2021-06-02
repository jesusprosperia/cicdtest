
// DEFINE PERMISSIONS HERE

const permissions = {
  // schemes
  create_schemes: true,
  update_schemes: true, // whether or not configure scenarios 
  delete_schemes: true,

  // datasets
  create_datasets: true,
  delete_datasets: true,

  delete_org: false,
  update_org: false,
};

const orgAttrs = {
  org_name: true,
  logo_url: true,
  profile_img_url: true,
  primary_color: true,
  secondary_color: true,
  max_users: true, 
  max_dataset_size: true,
  max_datasets: true,
  max_targeting_schemes: true,
}

const adminPermissions = {
  copy_schemes: true,
  update_users: true,
  create_users: true,
  delete_users: true,

  delete_org: false,
  update_org: Object.assign({}, orgAttrs, {
    max_users: false,
    max_dataset_size: false,
    max_datasets: false,
    max_targeting_schemes: false,
  }),
};

const superAdminPermissions = {
  delete_org: true,
  update_org: orgAttrs,
};


// DEFINE USER TYPES BELOW AND EXPORT

const level_1 = Object.assign({}, permissions, {
  // schemes
  create_schemes: false,
  update_schemes: false,
  delete_schemes: false,

  // datasets
  create_datasets: false,
  delete_datasets: false,
});

const level_2 = Object.assign({}, permissions, {
  // schemes
  create_schemes: false,
  update_schemes: true, // can configure scenarios
  delete_schemes: false,

  // datasets
  create_datasets: false,
  delete_datasets: false,
});

const level_3 = Object.assign({}, permissions);
const admin = Object.assign({}, permissions, adminPermissions);
const super_admin = Object.assign({}, permissions, adminPermissions, superAdminPermissions);

module.exports = {
  level_1,
  level_2,
  level_3,
  admin,
  super_admin,
}