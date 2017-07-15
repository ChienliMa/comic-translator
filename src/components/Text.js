import React, {Component} from 'react';
import CONST from '../constants';

class TextComponent extends Component {
    constructor (props) {
        super(props);
        this.state = props.text;
        this.keyPressed = props.keyPressed;
        this.proxy = props.proxy;
        this.dragState = CONST.NOT_DRAGGING;
        this.oriPos = [0,0];
        this.anchor = [0,0];
        this.state.selected = false;
    }


    componentDidMount () {
        document.body.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.proxy.subscribe("SelectText", this.otherSelected.bind(this));
    }

    componentWillMount () {
        document.body.removeEventListener('mousemove', this.onMouseMove.bind(this));
    }

    otherSelected () { // allow multiple text selection
        if (!this.keyPressed[CONST.KEYCODE_ALT]){
            this.selected = false;
            this.forceUpdate();
        }
    }

    onMouseDown (event) {
        if (!this.keyPressed[CONST.KEYCODE_F]) {
            this.anchor = [event.clientX, event.clientY];
            this.oriPos = [].concat(this.state.pos);
            this.dragState = CONST.DRAG_START;

            if (!this.keyPressed[CONST.KEYCODE_ALT]) { // allow multiple text to be select when alt is pressd
                this.proxy.clearSubscribes("UpdateText");
            }
            this.proxy.trigger("SelectText", this.state);
            this.proxy.subscribe("UpdateText", this.update.bind(this));
            this.selected = true;
            this.forceUpdate();
        }
    }

    onMouseMove (event) {
        if (this.dragState === CONST.DRAG_START) { // / onclick
            this.dragState = CONST.DRAG_TEXT;
        }

        if (this.dragState === CONST.DRAG_TEXT) {
            let x = this.oriPos[0] + event.clientX - this.anchor[0];
            let y = this.oriPos[1] + event.clientY - this.anchor[1];
            this.state.pos = [x,y];
            this.forceUpdate();
        }
    }

    onMouseUp (event) {
        this.dragState = CONST.DRAG_NOTHING;
        this.forceUpdate();
    }

    update (newState) {
        for (let prop in newState) {
            this.state[prop] = newState[prop];
        }
        this.forceUpdate();
    }

    getSelectedTag() {
        let [x, y] = this.state.pos;
        let fontSize = this.state.size;
        return this.state.isVertical?
            (<g>
                <line x1={x-0.5*fontSize} y1={y} x2={x+0.5*fontSize} y2={y}
                      style={{'stroke':'red', 'stroke-width':2}} />
                <line x1={x+0.5*fontSize} y1={y} x2={x+0.5*fontSize} y2={y+fontSize}
                      style={{'stroke':'red', 'stroke-width':2}} />
            </g>)
            :
            (<g>
                <line x1={x-fontSize} y1={y-fontSize} x2={x+fontSize} y2={y-fontSize}
                      style={{'stroke':'red', 'stroke-width':2}} />
            </g>);
    }

    // no browser support stroke-alignment yet.
    // to support outer stroke, draw two tspan for each text, one with alignment, ont without
    getVerticalTspan() {
        let tspans = [];
        let [x, y] = this.state.pos;
        let lineGap = this.state.size * this.state.lineGap * 0.01;
        this.state.text.split("\n").forEach( (line, index) => {
            let dy = line.length - line.trim().length;
            tspans.push(<tspan stroke="#ffffff"
                               y={y + dy*this.state.size*0.1}
                               x={x - index*(this.state.size + lineGap)}>{line.trim()}</tspan>)
        });

        this.state.text.split("\n").forEach( (line, index) => {
            let dy = line.length - line.trim().length;
            tspans.push(<tspan y={y + dy*this.state.size*0.1}
                               x={x - index*(this.state.size + lineGap)}>{line.trim()}</tspan>)
        });
        return tspans;
    }

    getHorizentalTspan() {
        let tspans = [];
        let [x, y] = this.state.pos;
        let lineGap = this.state.size * this.state.lineGap * 0.01;
        this.state.text.split("\n").forEach( (line, index) => {
            tspans.push(<tspan  x={x} y={y + index*(this.state.size + lineGap)}
                               stroke="#ffffff">
                            {line}
                        </tspan>)
        });

        this.state.text.split("\n").forEach( (line, index) => {
            tspans.push(<tspan  x={x} y={y + index*(this.state.size + lineGap)}>
                            {line}
                        </tspan>)
        });
        return tspans;
    }

    render () {
        let [x, y] = this.state.pos;

        return (
            <g transform={`rotate(${this.state.rotate} ${x}, ${y})`}>
                <text x={x} y={y} alignmentBaseline="hanging" textAnchor={this.state.isVertical?'start':'middle'}

                      style={{writingMode:this.state.isVertical?'tb':'lr'}}
                      fontSize={this.state.size} fontFamily="sans-serif"

                      strokeLinejoin="round"  strokeLinecap="round" strokeWidth={this.state.strokeWidth}
                      strokeMiterlimit={200} fill="#000000"

                      onMouseDown={this.onMouseDown.bind(this)}  onMouseUp={this.onMouseUp.bind(this)}
                >
                    {this.state.isVertical?this.getVerticalTspan():this.getHorizentalTspan()}
                </text>

                {this.selected?this.getSelectedTag():null}
            </g>
        )
    }
}

export default TextComponent;
