function encodeQueryData(data) {
    for(const [key, value] of Object.entries(data)) {
        if(!data[key]) delete data[key];
    }
    return new URLSearchParams(data).toString();
}

function appendCSS(type, name) {
    $("<link/>", {
        rel: "stylesheet",
        type: "text/css",
        class: `preview_${type}`,
        href: `styles/${type}_${name}.css`
    }).appendTo("head");
}

function removeCSS(type) {
    $(`link[class="preview_${type}"]`).remove();
}