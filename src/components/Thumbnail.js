import React, { Component } from 'react';
import {Page} from '../utils';

class ThumbnailComponent extends Component {
    constructor (props) {
        super(props);
        this.page = props.page;
        this.proxy = props.proxy;
    }

    onClick () {
        this.proxy.trigger("SelectImg", this.page);
    }

    render () {
        return(
            <img src={this.page.image.src} alt={this.page.filename} onClick={this.onClick.bind(this)}
            />
        )
    }
}

export default ThumbnailComponent;


