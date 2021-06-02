import {csvParse} from "d3-dsv";

function JsonParser(chunks) {
    var counter = 0;
    var header = "";
    var prevLastLine = "";

    function parse(dataString) {
        if (dataString[0] === '\n') {
            dataString = dataString.substr(1);
        }

        if (dataString[dataString.length - 1] == '\n') {
            dataString = dataString.substr(0, dataString.length - 1);
        }

        const firstNewLineIndex = dataString.indexOf('\n');
        const lastNewLineIndex = dataString.lastIndexOf('\n');
        var lastLine = "";
        var firstLine = "";
        var data;

        // extract header
        if (counter == 0 && firstNewLineIndex > -1) {
            header = dataString.slice(0, firstNewLineIndex);
        }

        if (counter && firstNewLineIndex > -1) {
            firstLine = dataString.slice(0, firstNewLineIndex);
        }

        if (prevLastLine.length && firstLine.length) {
            var a = prevLastLine.split(',');
            var b = firstLine.split(',');

            if (a.length + b.length - 1 == header.split(',').length) {
                lastLine = prevLastLine + firstLine;
            } else if (a.length == b.length) {
                lastLine = prevLastLine + '\n' + firstLine;
            }
        }

        // if last line, remove from dataString
        if (lastNewLineIndex > -1 && counter < chunks - 1) {
            prevLastLine = dataString.slice(lastNewLineIndex + 1);
            dataString = dataString.slice(0, lastNewLineIndex);
        }

        // if not first chunk, remove first line
        if (counter && firstNewLineIndex > -1) {
            dataString = dataString.slice(firstNewLineIndex + 1);
        }

        if (lastLine.length) {
            dataString = lastLine + '\n' + dataString;
        }

        if (counter && header.length) {
            dataString = header + '\n' + dataString;
        }

        if (header != "" && dataString.length != header.length) {
            data = csvParse(dataString);

            counter++;
        }

        return data;
    }

    return parse;
}

/*
 * Valid options are:
 * - chunk_read_callback: a function that accepts the read chunk
                          as its only argument. If binary option
                          is set to true, this function will receive
                          an instance of ArrayBuffer, otherwise a String
 * - error_callback:      an optional function that accepts an object of type
                          FileReader.error
 * - success:             an optional function invoked as soon as the whole file has been
                          read successfully
 * - binary:              If true chunks will be read through FileReader.readAsArrayBuffer
 *                        otherwise as FileReader.readAsText. Default is false.
 * - chunk_size:          The chunk size to be used, in bytes. Default is 64K.
 */
export default function parseFile(file, options) {
    var opts = typeof options === 'undefined' ? {} : options;
    var fileSize = file.size;
    var chunkSize = typeof opts['chunk_size'] === 'undefined' ? 64 * 1024 : parseInt(opts['chunk_size']); // bytes
    var binary = typeof opts['binary'] === 'undefined' ? false : opts['binary'] == true;
    var offset = 0;
    var chunkCounter = 0;
    var readBlock = null;
    var chunkReadCallback = typeof opts['chunk_read_callback'] === 'function' ? opts['chunk_read_callback'] : function () {};
    var chunkErrorCallback = typeof opts['error_callback'] === 'function' ? opts['error_callback'] : function () {};
    var success = typeof opts['success'] === 'function' ? opts['success'] : function () {};
    var parser = JsonParser(Math.ceil(fileSize / chunkSize));

    var onLoadHandler = function (evt) {
        if (evt.target.error == null) {
            offset = ++chunkCounter * chunkSize;
            var data = parser(evt.target.result);
            chunkReadCallback(data, Math.min(offset / fileSize, 1), chunkCounter, () => {
                if (offset >= fileSize) {
                    success(file);
                    return;
                }
                readBlock(offset, chunkSize, file);
            });
        } else {
            chunkErrorCallback(evt.target.error);
            return;
        }
    }

    readBlock = function (_offset, length, _file) {
        var r = new FileReader();
        var blob = _file.slice(_offset, length + _offset);
        r.onload = onLoadHandler;
        if (binary) {
            r.readAsArrayBuffer(blob);
        } else {
            r.readAsText(blob);
        }
    }

    readBlock(offset, chunkSize, file);
}