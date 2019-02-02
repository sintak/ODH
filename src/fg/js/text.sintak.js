function isEmpty(word) {
    return (!word);
}

function isShortandNum(word) {
    let numReg = /\d/;
    return (word.length < 2/*3*/ || numReg.test(word));
}

function isChinese(word) {
    let cnReg = /[\u4e00-\u9fa5]+/gi;
    return (cnReg.test(word));
}

function isInvalid(word) {
    if (isChinese(word)) return false;
    return (isChinese(word) && isEmpty(word) || isShortandNum(word));
}

function cutSentence(word, sentence, sentenceNum) {

    if (sentenceNum > 0) {
        let puncts = sentence.match(/[\.\?!;]/g) || [];
        let arr = sentence.split(/[\.\?!;]/).filter(s => s.trim() !== '').map((s, index) => s.trim() + `${puncts[index] || ''} `);
        let index = arr.findIndex(s => s.indexOf(word) !== -1);
        let left = Math.ceil((sentenceNum - 1) / 2);
        let start = index - left;
        let end = index + ((sentenceNum - 1) - left);

        if (start < 0) {
            start = 0;
            end = sentenceNum - 1;
        } else if (end > (arr.length - 1)) {
            end = arr.length - 1;

            if ((end - (sentenceNum - 1)) < 0) {
                start = 0;
            } else {
                start = end - (sentenceNum - 1);
            }
        }

        return arr.slice(start, end + 1).join('');//.replace(word, '<b>' + word + '</b>');
    } else {
        return sentence;//.replace(word, '<b>' + word + '</b>');
    }
}

function getSentence(sentenceNum) {
    let sentence = '';
    const upNum = 4;

    const selection = window.getSelection();
    let word = (selection.toString() || '').trim();

    if (selection.rangeCount < 1)
        return;

    let node = selection.getRangeAt(0).commonAncestorContainer;

    if (['INPUT', 'TEXTAREA'].indexOf(node.tagName) !== -1) {
        return;
    }

    node = getBlock(node, upNum);

    if (node !== document) {
        sentence = node.innerText;
    }

    return cutSentence(word, sentence, sentenceNum);
}

function getBlock(node, deep) {
    const blockTags = ['LI', 'P', 'DIV', 'BODY'];
    const nodeName = node.nodeName.toUpperCase();
    if (blockTags.includes(nodeName) || deep === 0) {
        return node;
    } else {
        return getBlock(node.parentElement, deep - 1);
    }
}

function selectedText(){
    const selection = window.getSelection();
    return (selection.toString() || '').trim();
}

function isValidElement(){
    const invalidTags = ['INPUT', 'TEXTAREA'];
    const nodeName = document.activeElement.nodeName.toUpperCase();
    if (invalidTags.includes(nodeName)){
        return false;
    } else {
        return true;
    }
}