//代理：就是新建个类调用老类的接口，包一下

function Person(){}

Person.prototype.sayName = function () {
    console.log('fengzhx');
}

Person.prototype.sayAge = function () {
    console.log(25);
}

function PersonProxy() {
    this.person = new Person();
    let that = this;
    this.callMathod = function (functionName) {
        console.log('before proxy:',functionName);
        that.person[functionName]();
        console.log('after proxy:',functionName);
    }
}

let pp = new PersonProxy();
pp.callMathod('sayAge');
