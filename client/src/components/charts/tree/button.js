function renderButton(params) {
    var container = params.container;
    var imgWidth = params.imgWidth || 20,
        imgHeight = params.imgHeight || 20,
        imgRectPadding = params.imgRectPadding || 2.5,
        background = params.hasOwnProperty('background') ? params.background : true
    var btn;
    var clickFunc = function () { };

    function main() {
        btn = container.append('g')
            .attr('opacity', params.visible ? 1 : 0)
            .attr('pointer-events', params.visible ? 'all' : 'none')
            .attr('transform', `translate(${params.translation})`);

        if (background) {
            btn.append('rect')
                .attr('width', imgWidth + imgRectPadding * 2)
                .attr('height', imgHeight + imgRectPadding * 2)
                .attr('x', -imgRectPadding - imgWidth / 2)
                .attr('y', -imgRectPadding)
                .attr('stroke', '#ddd')
                .attr('fill', 'none')
                .attr('rx', 5)
                .attr('ry', 5)
        }

        btn.append('image')
            .attr('width', imgWidth)
            .attr('height', imgHeight)
            .attr('x', -imgWidth / 2)
            .attr('xlink:href', params.btnUrl)
            .attr('cursor', 'pointer');

        btn.on('click', d => {
            clickFunc(d);
        });

        return main;
    }

    main.show = function () {
        params.visible = true;
        btn.attr('opacity', params.visible ? 1 : 0)
            .attr('pointer-events', params.visible ? 'all' : 'none');

        return main;
    }

    main.hide = function () {
        params.visible = false;
        btn.attr('opacity', params.visible ? 1 : 0)
            .attr('pointer-events', params.visible ? 'all' : 'none');
        return main;
    }

    main.translate = function (translation) {
        if (!arguments.length) {
            return params.translation;
        }
        params.translation = translation;
        btn
            .transition().duration(750)
            .attr('transform', `translate(${params.translation})`);
        return main;
    }

    main.translateYBy = function (dy) {
        btn
            .transition().duration(750)
            .attr('transform', `translate(${params.translation[0]}, ${params.translation[1] + dy})`);
        return main;
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

export default renderButton;