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

    const createAutoCompleteManager = () => {
        let currentResults = [];
        let selectedIndex = -1;

        const setResults = (results) => {
            currentResults = results;
            selectedIndex = -1;
        };

        const getCurrentResults = () => currentResults;
        const setSelectedIndex = (index) => {
            console.log(index);
            return selectedIndex = index;
        } 

        const moveSelection = (direction) => {
            if (currentResults.length === 0) return selectedIndex;
            
            if (direction === 'up') {
                selectedIndex = selectedIndex <= 0 ? currentResults.length - 1 : selectedIndex - 1;
            } else if (direction === 'down') {
                selectedIndex = selectedIndex >= currentResults.length - 1 ? 0 : selectedIndex + 1;
            }
            
            return selectedIndex;
        };

        const getSelectedItem = () => {
            console.log("getSelectedItem" + selectedIndex);
            return selectedIndex >= 0 ? currentResults[selectedIndex] : null;
        }

        return {
            setResults,
            getCurrentResults,
            setSelectedIndex,
            moveSelection,
            getSelectedItem
        };
    }

    const autoCompleteManager = createAutoCompleteManager();

    // 자동완성 결과 표시 함수
    const renderAutoComplete = (results) => {
        autoCompleteManager.setResults(results);
        
        if (results.length === 0) {
            autocompleteListItems.classList.add('hidden');
            return;
        }

        autocompleteListItems.classList.remove('hidden');
        autocompleteListItems.querySelectorAll('div').forEach((item, index) => {
            if (index < results.length) {
                item.innerText = results[index];
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    };

    // 포커스 시 리스트 표시
    searchInput.addEventListener('focus', () => {
        autocompleteList.classList.remove('hidden');
    });

    // 포커스 아웃 시 리스트 숨기기
    searchInput.addEventListener('blur', (e) => {
        // relatedTarget으로 포커스가 이동한 요소 확인
        if (!autocompleteList.contains(e.relatedTarget)) {
            autocompleteList.classList.add('hidden');
        }
    });

    // 키 입력 시 자동완성
    searchInput.addEventListener('input', (e) => {
        autoCompleteManager.setSelectedIndex(-1);
        highlightSelected(-1);

        if (e.target.value === '') {
            renderAutoComplete([]);
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

        renderAutoComplete(arr);
        
    });

    
    // 입력 필드 키보드 이벤트 (엔터, 방향키)

    // 선택된 항목 하이라이트
    const highlightSelected = (index) => {
        const items = autocompleteListItems.querySelectorAll('div:not(.hidden)');
        items.forEach((item, i) => {
            item.classList.toggle('bg-gray-100', i === index);
        });
    };

    // 키보드 이벤트 핸들러
    const handleKeyboardNavigation = (event) => {
        const keyActions = {
            'Enter': () => {
                const selectedItem = autoCompleteManager.getSelectedItem();
                if (selectedItem) {
                    searchInput.value = selectedItem;
                    autocompleteListItems.classList.add('hidden');
                }
            },
            'ArrowUp': () => {
                event.preventDefault();
                const newIndex = autoCompleteManager.moveSelection('up');
                highlightSelected(newIndex);
            },
            'ArrowDown': () => {
                event.preventDefault();
                const newIndex = autoCompleteManager.moveSelection('down');
                highlightSelected(newIndex);
            }
        };

        const action = keyActions[event.key];
        if (action) action();
    };

    searchInput.addEventListener('keydown', handleKeyboardNavigation);

    // 자동완성 리스트 마우스 이벤트
    autocompleteListItems.querySelectorAll('div').forEach((item, index) => {

        item.addEventListener('click', () => {
            searchInput.value = item.innerText;
            autocompleteListItems.classList.add('hidden');
        });

        item.addEventListener('mouseenter', () => {
            autoCompleteManager.setSelectedIndex(index);
            highlightSelected(index);
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



