let obj = { // Helper functions for handlebars file
    // Called if value is undefined, replaces with null 
    loggedIn: function(value){
        if (value == 'Logged in') {
            return true;
        } else {
            return false;
        };
    }

};
module.exports = { obj };