const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 0; // mongo will return all docs from collection if limit is set to 0

function getPagination(query) {
  const page = Math.abs(query.page) || DEFAULT_PAGE;
  const limit = Math.abs(query.limit) || DEFAULT_LIMIT;

  const skip = (page - 1) * limit;

  return {
    skip,
    limit,
  };
}

module.exports = {
  getPagination,
};

// page 1 -> skip - 0
// page 2 -> skip - 50
// page 3 -> skip - 100

// (page - 1) * limit
// page * limit - limit
