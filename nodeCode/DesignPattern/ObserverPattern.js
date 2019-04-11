function Publisher() {
    this.listeners = [];
}
Publisher.prototype = {
    'addListener':function(listener){
        this.listeners.push(listener);
    },
    'deleteListener':function(listener){
        delete this.listeners[this.listeners.indexOf(listener)];
    },
    'notify':function(obj){
        for(let i = 0;i<this.listeners.length;i++){
            let listener = this.listeners[i];
            if(typeof listener != 'undefined'){
                listener.process(obj);
            }
        }
    }
};
function Listener(name){
    this.name = name;
}
Listener.prototype.process = function(obj){
    console.log(`${this.name}收到${obj}`);
}

let pb = new Publisher();
let listenerA = new Listener('A');
let listenerB = new Listener('B');
pb.addListener(listenerA);
pb.addListener(listenerB);
pb.notify(1);