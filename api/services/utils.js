module.exports = {

    dbConWrap: function (fn, dbConnection) {
        if (dbConnection) {
            return fn.usingConnection(dbConnection)
        } else {
            return fn;
        }
    }

}