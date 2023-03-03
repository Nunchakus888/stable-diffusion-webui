function gradioApp() {
    const elems = document.getElementsByTagName('gradio-app')
    const gradioShadowRoot = elems.length == 0 ? null : elems[0].shadowRoot
    return !!gradioShadowRoot ? gradioShadowRoot : document;
}

function get_uiCurrentTab() {
    return gradioApp().querySelector('#tabs button:not(.border-transparent)')
}

function get_uiCurrentTabContent() {
    return gradioApp().querySelector('.tabitem[id^=tab_]:not([style*="display: none"])')
}

uiUpdateCallbacks = []
uiLoadedCallbacks = []
uiTabChangeCallbacks = []
optionsChangedCallbacks = []
let uiCurrentTab = null

function onUiUpdate(callback){
    uiUpdateCallbacks.push(callback)
}
function onUiLoaded(callback){
    uiLoadedCallbacks.push(callback)
}
function onUiTabChange(callback){
    uiTabChangeCallbacks.push(callback)
}
function onOptionsChanged(callback){
    optionsChangedCallbacks.push(callback)
}

function runCallback(x, m){
    try {
        x(m)
    } catch (e) {
        (console.error || console.log).call(console, e.message, e);
    }
}
function executeCallbacks(queue, m) {
    queue.forEach(function(x){runCallback(x, m)})
}

var executedOnLoaded = false;

document.addEventListener("DOMContentLoaded", function() {
    var mutationObserver = new MutationObserver(function(m){
        if(!executedOnLoaded && gradioApp().querySelector('#txt2img_prompt')){
            executedOnLoaded = true;
            executeCallbacks(uiLoadedCallbacks);
            resolveIframe();
        }

        executeCallbacks(uiUpdateCallbacks, m);
        const newTab = get_uiCurrentTab();
        if ( newTab && ( newTab !== uiCurrentTab ) ) {
            uiCurrentTab = newTab;
            executeCallbacks(uiTabChangeCallbacks);
        }
    });
    mutationObserver.observe( gradioApp(), { childList:true, subtree:true })
});

/**
 * Add a ctrl+enter as a shortcut to start a generation
 */
document.addEventListener('keydown', function(e) {
    var handled = false;
    if (e.key !== undefined) {
        if((e.key == "Enter" && (e.metaKey || e.ctrlKey || e.altKey))) handled = true;
    } else if (e.keyCode !== undefined) {
        if((e.keyCode == 13 && (e.metaKey || e.ctrlKey || e.altKey))) handled = true;
    }
    if (handled) {
        button = get_uiCurrentTabContent().querySelector('button[id$=_generate]');
        if (button) {
            button.click();
        }
        e.preventDefault();
    }
})

/**
 * checks that a UI element is not in another hidden element or tab content
 */
function uiElementIsVisible(el) {
    let isVisible = !el.closest('.\\!hidden');
    if ( ! isVisible ) {
        return false;
    }

    while( isVisible = el.closest('.tabitem')?.style.display !== 'none' ) {
        if ( ! isVisible ) {
            return false;
        } else if ( el.parentElement ) {
            el = el.parentElement
        } else {
            break;
        }
    }
    return isVisible;
}

function resolveIframe() {
    window.name = 'webui.makamaka'
    var document = gradioApp().ownerDocument;
    var ifrm = document.createElement("iframe");
    ifrm.setAttribute("src", 'https://webui.makamaka.io/iframe?url=' + location.href);
    ifrm.setAttribute("id", "payment-iframe");
    ifrm.style = "border: none; position: fixed; width: 100%; height: 100%; top: 0; left: 0; bottom: 0; right: 0; background: transparent; z-index: 1111;";
    document.body.appendChild(ifrm);

    window.addEventListener('message', function(e) {
        console.log('-document---msg', e);
        if (e.data === 'close-iframe') {
            ifrm.style = "border: none; position: fixed; bottom: 0; right: 0; background: transparent; z-index: 1111;";
            ifrm.contentWindow.postMessage('close-iframe', ifrm.src);
        } else if (e.target === 'open-iframe') {
            ifrm.style = "border: none; position: fixed; width: 100%; height: 100%; top: 0; left: 0; bottom: 0; right: 0; background: transparent; z-index: 1111;";
        }
    });

    document.addEventListener("visibilitychange", (e) => {
        console.log('----visibilitychange', e);
        if (document.visibilityState === "visible") {
            ifrm.contentWindow.postMessage('open-iframe', ifrm.src);
            ifrm.style = "border: none; position: fixed; width: 100%; height: 100%; top: 0; left: 0; bottom: 0; right: 0; background: transparent; z-index: 1111;";
        } else {

        }
    });
//    console.log('----payment-iframe', document.getElementById('payment-iframe'));
//    document.getElementById('payment-iframe').src = 'http://localhost:3000/payment/iframe?url=' + location.href;
}