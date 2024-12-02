const 초성_리스트 = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const 중성_리스트 = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const 종성_리스트 = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

function decompose(char) {
    const code = char.charCodeAt(0) - 0xAC00;
    
    if (code < 0 || code > 11171) return null; // 한글이 아닌 경우
    
    const 초성 = Math.floor(code / (21 * 28));
    const 중성 = Math.floor((code % (21 * 28)) / 28);
    const 종성 = code % 28;
    
    return {
        초성: 초성_리스트[초성],
        중성: 중성_리스트[중성],
        종성: 종성_리스트[종성]
    };
}

function compose(초성, 중성, 종성 = '') {
    const 초성_인덱스 = 초성_리스트.indexOf(초성);
    const 중성_인덱스 = 중성_리스트.indexOf(중성);
    const 종성_인덱스 = 종성 ? 종성_리스트.indexOf(종성) : 0;
    
    if (초성_인덱스 < 0 || 중성_인덱스 < 0 || 종성_인덱스 < 0) return null;
    
    const code = (초성_인덱스 * 21 + 중성_인덱스) * 28 + 종성_인덱스 + 0xAC00;
    return String.fromCharCode(code);
}


function textToJamo(text) {
    return Array.from(text).flatMap(char => {
        const result = decompose(char);
        if (result) {
            if (result.종성 !== '') return [result.초성, compose(result.초성, result.중성), compose(result.초성, result.중성, result.종성)];
            else return [result.초성, compose(result.초성, result.중성)];
        }
        return [char];
    });
}

// 사용 예시
// console.log(text_to_jamo('안녕')); // ['ㅇ', '아', '안', 'ㄴ', '녀', '녕']


function xmlToJson(xml) {
    // Create the return object
    var obj = {};
  
    if (xml.nodeType == 1) {
        // element
        // do attributes
            if (xml.attributes.length > 0) {
                obj["@attributes"] = {};
                for (var j = 0; j < xml.attributes.length; j++) {
                    var attribute = xml.attributes.item(j);
                    obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                }
            }
    } 
    else if (xml.nodeType == 3) {
        // text
        obj = xml.nodeValue;
    }
  
    // do children
    // If all text nodes inside, get concatenated text from them.
    var textNodes = [].slice.call(xml.childNodes).filter(function(node) {
        return node.nodeType === 3;
    });
    if (xml.hasChildNodes() && xml.childNodes.length === textNodes.length) {
        obj = [].slice.call(xml.childNodes).reduce(function(text, node) {
            return text + node.nodeValue;
        }, "");
    } 
    else if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof obj[nodeName] == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof obj[nodeName].push == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}