function renderTextButton(params) {
    var container = params.container;
    var btn, clickFunc = function () { };

    function main() {
        btn = container.append('g')
            .attr('opacity', params.visible ? 1 : 0)
            .attr('pointer-events', params.visible ? 'all' : 'none')
            .attr('transform', `translate(${params.translation})`);

        var div = document.createElement('div');
        div.innerHTML = params.html;
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.whiteSpace = 'nowrap';
        div.style.height = 'auto';
        div.style.width = 'auto';
        document.body.appendChild(div);

        var width = div.clientWidth + 10;
        var height = div.clientHeight + 2;

        document.body.removeChild(div);

        btn.append('foreignObject')
            .attr('width', width)
            .attr('height', height)
            .attr('x', -width / 2)
            .attr('y', -height / 2)
            .html(params.html);

        btn.on('click', d => {
            clickFunc(d);
        });

        return main;
    }

    main.show = function () {
        params.visible = true;
        btn.attr('opacity', params.visible ? 1 : 0)
            .attr('pointer-events', params.visible ? 'all' : 'none')
    }

    main.hide = function () {
        params.visible = false;
        btn.attr('opacity', params.visible ? 1 : 0)
            .attr('pointer-events', params.visible ? 'all' : 'none')
    }

    main.translate = function (translation) {
        params.translation = translation;
        btn
            .transition().duration(750)
            .attr('transform', `translate(${params.translation})`)
    }

    main.click = function (f) {
        clickFunc = f;
        return main;
    }

    main.getNode = function () {
        return btn.node();
    }

    return main();
}

export default renderTextButton;