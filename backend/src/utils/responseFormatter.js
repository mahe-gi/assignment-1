const sendSuccess = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendPaginated = (res, statusCode = 200, message = 'Success', data = [], meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: {
      page: meta.page || 1,
      limit: meta.limit || 10,
      total: meta.total || 0,
      totalPages: meta.totalPages || 0
    }
  });
};

const sendError = (res, statusCode = 400, message = 'An error occurred', errors = null) => {
  const response = {
    success: false,
    message
  };
  if (errors && Array.isArray(errors) && errors.length > 0) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendPaginated,
  sendError
};
