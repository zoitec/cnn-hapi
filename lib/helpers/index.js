'use strict';



module.exports = {
    /**
     * Validate that response header exists
     * @param {object} request
     */
    hasHeaders: function (request) {
        let value = false;

        if (typeof request.response === 'object' &&
            request.response !== null &&
            typeof request.response.header === 'function') {
            value = true;
        }

        return value;
    }
};
