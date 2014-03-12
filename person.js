var uuid = require('node-uuid')
, people = {};

function Person(name, status) {
  this.name = name;
  this.status = status;
};

Person.prototype.join = function(name) {

};