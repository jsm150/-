function initMap() {
    // 대한 민국 중심
    const lat = 36.517464
    const lng = 127.817132

    const mapContainer = document.querySelector('#map'), // 지도를 표시할 div 
        mapOption = {
            center: new kakao.maps.LatLng(lat, lng), // 지도의 중심좌표
            level: 13 // 지도의 확대 레벨
        };

    // 지도를 표시할 div와  지도 옵션으로  지도를 생성합니다
    return new kakao.maps.Map(mapContainer, mapOption);
}

async function initCityCode() {
    const response = await fetch('./cityCode.json');
    return await response.json();
}

function searchAreaEventSetting(cityCode) {
    // 자동 완성 리스트 생성
    const trie = new Trie();
    Object.keys(cityCode).forEach(key => {
        const jamo = textToJamo(key.replaceAll(" ", ""));
        trie.insert(jamo, key);
    });

    const searchInput = document.querySelector('#searchInput');
    const autocompleteList = document.querySelector('#autocompleteList');
    const autocompleteListItems = autocompleteList.firstElementChild;

    // 포커스 시 리스트 표시
    searchInput.addEventListener('focus', () => {
        autocompleteList.classList.remove('hidden');
    });

    // 포커스 아웃 시 리스트 숨기기
    searchInput.addEventListener('blur', (e) => {
        autocompleteList.classList.add('hidden');
    });

    // 키 입력 시 자동완성
    searchInput.addEventListener('input', (e) => {
        if (e.target.value === '') {
            autocompleteListItems.classList.add('hidden');
            return;
        }

        const input = e.target.value.replaceAll(" ", "")

        const jamo1 = textToJamo(input);
        const arr = trie.searchStartWith(jamo1);
        
        // console.log(e.target.value);
        
        if (arr.length < 5) {
            const temp = decompose(input[input.length - 1]);
            if (temp !== null && temp.종성 !== '') {
                const input2 = input.substring(0, input.length - 1) + compose(temp.초성, temp.중성) + temp.종성;
                const jamo2 = textToJamo(input2);
    
                arr.push(...trie.searchStartWith(jamo2, 5 - arr.length));  
            }
        } 

        // console.log(arr);
        
        if (arr.length === 0) {
            autocompleteListItems.classList.add('hidden');
            return;
        }

        autocompleteListItems.classList.remove('hidden');
        // console.log(autocompleteListItems.querySelectorAll('div'));
        autocompleteListItems.querySelectorAll('div').forEach((item, index) => {
            if (index < arr.length) {
                item.innerText = arr[index];
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    });
}

async function main() {
    const map = initMap();
    const cityCode = await initCityCode();

    searchAreaEventSetting(cityCode);

    // const url = `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev?LAWD_CD=${cityCode['부산 영도구']}&DEAL_YMD=201512&pageNo=1&numOfRows=1000&serviceKey=bMwwNr1uwE0kwt%2BQ5tCxjvNwBHQL0bIaJiBfd31z8vIvj5gcagERlUf6Pw0J%2BmQWhyjCNsednMfHyLI2U0TTfA%3D%3D`;
    // const data = await fetch(url);
    // const xml = await data.text();

    // const json = xmlToJson(new DOMParser().parseFromString(xml, "text/xml"));
    // console.log(json);


    // ------------------------------

}

main();



