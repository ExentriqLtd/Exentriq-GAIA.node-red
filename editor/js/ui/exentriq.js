RED.exentriq = (function() {

    function getOwner(){
        var group = RED.settings.company.group;
        var company_piece = RED.settings.company.id;
        var group_piece = group ? '-'+group:'';
        var owner = company_piece + group_piece;
        return owner;
    };

    function isOwner(owner){
        return (getOwner() == owner);
    };

    return {

        init: function() {

        },

        printCompany: function() {
            console.log(RED.settings.company);
        },

        isOwner: isOwner,

        getOwner: getOwner
    }

})();