
export {
    Project,
    Page,
    Text,
    Rect,
    EventProxy
}

class Project {
    constructor (){
        this.name = "defaultname";
        this.image = null;
        this.svgSrc = "";
        this.pages = [];
        this.proxy = new EventProxy();
    }
}

class Page {
    constructor (filename, src, key){
        let image = new Image();
        image.src = src;
        image.crossOrigin = "Anonymous";

        this.image = image;
        this.filename = filename;
        this.rects = []; // rects that cover original texts
        this.texts = [];
    }
}

class Text {
    constructor (pos) {
        this.pos = pos;
        this.text = "請輸入文字";

        this.size = 30;
        this.style= "华康简仿宋";

        this.strokeWidth = 0;
        this.isVertical = false;
        this.rotate = 0; // degree
        this.lineGap = 0;

        this.key =  new Date().getTime().toString();// for React to identify objects

        this.textOrientation = 'upright'; // we wont change this
    }
}

class Rect {
    constructor (pos1, pos2) {
        this.pos1 = pos1;
        this.pos2 = pos2;
    }

    renderOnContext(ctx) {
        const [x,y] = this.pos1;
        const [x1, y1] = this.pos2;
        ctx.fillStyle = "white";
        ctx.fillRect(x, y, x1 - x, y1 - y);
    }
}

class EventProxy {
    constructor () {
        this.events = {};
    }

    subscribe (event, callback) {
        if (this.events[event] == null) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    clearSubscribes (event) {
        this.events[event] = [];
    }

    trigger (event, msg) {
        if ( this.events[event] ) {
            this.events[event].map((callback)=>{return callback(msg);});
        }

    }
}
