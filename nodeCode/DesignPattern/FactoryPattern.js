function Person(){
    this.name = 'person';
}

function Animal(){
    this.name = 'animal';
}

function Factory(){}
Factory.prototype.getInstance = function(className){
    return eval(`new ${className}()`);
}

let factory = new Factory();
let person = factory.getInstance('Person');
let animal = factory.getInstance('Animal');
console.log(person.name);
console.log(animal.name);