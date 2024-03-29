/**
 *
 *  todo:
 *   - propagate 'click anywhere on window' to the inner widget e.g. to close menues etc.
 *   - propagate attribute changes to inner widget
 *   - publish events from inner widget, not only resize
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
const commoncss = `       :host {
            display:    block;
            box-sizing: border-box;
            margin:     0;
            padding:    1px;
            width:      100%;
           height:     auto;   
        /*  border:     1px dotted red; */
        /*    overflow:   auto; */
        }
        * {
            box-sizing: border-box;
            padding:    0;
            margin:     0;
        }
        iframe {
            width:      100%;
         /*   height:     100%; */
        }
`;

export default class ThoregonWidget extends HTMLElement {

    constructor() {
        super();
    }


    /**
     * with this tag, the element is available in the html document
     * override by subclass. mandatory!
     */
    static get elementTag() {
        throw new Error(`NotImplemented: ${this.constructor.name}.elementTag()`);
    }

    /**
     * register this element class in the browser
     * @param {String}  tag - if not supplied the 'elementTag' of the class is used
     */
    static defineElement(tag) {
        tag = tag || this.elementTag;
        if (window.customElements) {
            customElements.define(tag, this);
        } else {
            universe.logger.warn(`customElements not available, can't register '${tag}'`);
        }
    }

    //
    // Widget subclasses
    //

    get widgetURL() {
        throw Error(`NotImplemented: ${this.constructor.name}.elementTag()`);
    }

    //
    // display widget
    //

    prepare() {
        var shadow      = this.shadowRoot || this.attachShadow({ mode: 'open' });
        let style = document.createElement('style');
        style.textContent = commoncss;
        shadow.appendChild(style);
    }

    render() {
        let iframe = document.createElement('iframe');
        let origin = this.buildWidgetURL();
        iframe.setAttribute("src", origin);
        iframe.setAttribute('frameborder', 0);
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('scrolling', 'no');

/*
        iframe.setAttribute("width", this.offsetWidth + 'px');
        iframe.setAttribute("heigth", this.offsetHeight + 'px');
*/
        this.forwardSurroundingClicks();
        this.listenWidgetEvents();

        // keep for communication
        this.iframe = iframe;
        this.shadowRoot.appendChild(iframe);
    }

    buildWidgetURL() {
        let url = new URL(this.widgetURL);
        let params = url.searchParams;
        // tell the target that is is used as widget
        params.append('intf-iswidget', '1');
        // attributes will be forwarded as interface params. will be used in the target component if defined
        this.getAttributeNames().forEach(name => params.append(`intf-${name}`, encodeURIComponent(this.getAttribute(name))));
        return url.toString();
    }

    adjustAndCheckParams(params) {
        // implement by subclass
        // throw on error(s)
    }

    forwardSurroundingClicks() {
        // listen to all clicks outside the widget hatch and forward it to the widget
        // todo [OPEN]: check if click inside should be filtered bceause the widget receives it anyways
        document.body.addEventListener(
            'click',
            (evt) => this.iframe.contentWindow.postMessage({ type: 'surroundingClick', x: evt.x, y: evt.y, timeStamp: evt.timeStamp, isTrusted: evt.isTrusted }, '*'),
            true /* useCapture: dispatch always before being dispatched to any other handler, can't be stopped by cancelPropagation -> https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener */);
    }

    listenWidgetEvents() {
        window.addEventListener('message', (evt) => this.widgetEvent(evt));
    }

    widgetEvent(evt) {
        // check if the message comes from the embedded widget
        if (!this.widgetURL.startsWith(evt.origin)) return;
        // debugger;
        // console.log(">> received widget event", evt.data);
        if (!this.handleWidgetEvent(evt)) this.defaultWidgetEvent(evt);
    }

    /**
     * implement event handling
     * if not handled by subclass return false
     * @param evt
     * @return {boolean}
     */
    handleWidgetEvent(evt) {
        // implement by subclass
        return false
    }

    defaultWidgetEvent(evt) {
        const type = evt.data.type;
        switch (type) {
            case 'resize':
//                this.resize(evt);
                break;
        }
    }

    resize(evt) {
        if (evt.data.height) this.iframe.style.height = evt.data.height + "px";
        if (evt.data.width)  this.iframe.style.width  = evt.data.width  + "px";     // was outcommented before! check why
    }

    /**
     * if there is the need to cleanup, do it here.
     * invoked when the element (widget) gets removed from the DOM
     */
    destroy() {
        // invoked when element is disconnected from the DOM e.g. view closes
        // implement by subclass
    }

    /**
     * support element added event:
     *   <library>-<element>-added  ... event detail contains the element
     *   <library>-element-added    ... event detail contains { event: 'added', tag: '<elements tag name>', element: <this element>}
     *
     * called when the element is attached to the DOM
     */
    connectedCallback() {
        (async () => {
            if (this._connected) return;
            this._connected = true;
            this.prepare();
            this.render();

        })();
    }

    /**
     * support aurora-element-removed events on document.
     * called when the element is disconnected from the DOM
     */
    disconnectedCallback() {
        try { this.destroy();} catch (e) { console.log("UI Error on destroy", e) }
    }

}
