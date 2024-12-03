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

function initClusterer(map) {
    return new kakao.maps.MarkerClusterer({
        map: map, // 마커들을 클러스터로 관리하고 표시할 지도 객체 
        averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정 
        minLevel: 9 // 클러스터 할 최소 지도 레벨 
    });
}

async function initCityCode() {
    const response = await fetch('./cityCode.json');
    return await response.json();
}

function searchAreaEventSetting(cityCode, dataFetch) {
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
                if (autoCompleteManager.getSelectedItem() === null) {
                    // 검색
                    const input = searchInput.value.replaceAll(" ", "");
                    const jamo = textToJamo(input);
                    const code = trie.search(jamo);
                    if (code !== '') {
                        dataFetch(cityCode[code]);
                    }
                }
                else {
                    const selectedItem = autoCompleteManager.getSelectedItem();
                    if (selectedItem) {
                        searchInput.value = selectedItem;
                        autocompleteListItems.classList.add('hidden');
                        renderAutoComplete([]);
                    }
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
            renderAutoComplete([]);

        });

        item.addEventListener('mouseenter', () => {
            autoCompleteManager.setSelectedIndex(index);
            highlightSelected(index);
        });
    });

    // 검색 버튼 클릭 이벤트
    const searchButton = document.querySelector('#searchButton');
    searchButton.addEventListener('click', () => {
        const input = searchInput.value.replaceAll(" ", "");
        const jamo = textToJamo(input);
        const code = trie.search(jamo);
        if (code !== '') {
            dataFetch(cityCode[code]);
        }
    });
}

function pickerChange(clusterer, map, arr) {
    clusterer.clear();
    
    // roadNm(도로명) + roadNmBonbun(건물 코드)
    arr.forEach((item) => {
        const geocoder = new kakao.maps.services.Geocoder();
        console.log(`${item.roadNm} ${parseInt(item.roadNmBonbun)}`);
        geocoder.addressSearch(`${item.roadNm} ${parseInt(item.roadNmBonbun)}`, function(result, status) {
            // 정상적으로 검색이 완료됐으면 
             if (status === kakao.maps.services.Status.OK) {
        
                const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                console.log(coords);
        
                // 결과값으로 받은 위치를 마커로 표시합니다
                const marker = new kakao.maps.Marker({
                    position: coords
                });
                
                clusterer.addMarker(marker);

                const infowindow = new kakao.maps.InfoWindow({
                    content : `<div class="flex flex-col items-center">
                                    <div class="bg-white shadow-lg rounded-xl p-3 mb-2 transition-transform transform group-hover:scale-105 backdrop-blur-sm bg-opacity-95">
                                        <div class="text-sm font-medium">모라동원타운 </div>
                                        <div class="text-blue-500 font-bold text-lg">4억 2,000</div>
                                    </div>
                                </div>`,
                    removable : true
                });
                kakao.maps.event.addListener(marker, 'mouseover', function() {
                    infowindow.open(map, marker);
                });
        
                kakao.maps.event.addListener(marker, 'mouseout', function() {
                    infowindow.close();
                });

                // // 인포윈도우로 장소에 대한 설명을 표시합니다
                // var infowindow = new kakao.maps.InfoWindow({
                //     content: '<div style="width:150px;text-align:center;padding:6px 0;">우리회사</div>'
                // });
                // infowindow.open(map, marker);
        
                // 지도의 중심을 결과값으로 받은 위치로 이동시킵니다
                // map.setCenter(coords);
            } 
        });
    });
}

async function createDataFetch(clustery, map, action) {
    return async (cityCode) => {
        const size = 1000;
        const url = `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev?LAWD_CD=${cityCode}&numOfRows=${size}&serviceKey=bMwwNr1uwE0kwt%2BQ5tCxjvNwBHQL0bIaJiBfd31z8vIvj5gcagERlUf6Pw0J%2BmQWhyjCNsednMfHyLI2U0TTfA%3D%3D`;

        const list = [];

        const today = new Date();
        // const start = new Date(today.setMonth(today.getMonth() - 6));
        const start = new Date(today.setMonth(today.getMonth() - 0));
        const date = new Date();

        // 최근 6개월 데이터를 가져옵니다
        while (start <= date) {
            let pageNo = 1;

            while (true) {
                const data = await fetch(url + `&pageNo=${pageNo++}&DEAL_YMD=${date.getFullYear()}${('0' + (date.getMonth() + 1)).slice(-2)}`);
                const xml = await data.text();
        
                const json = xmlToJson(new DOMParser().parseFromString(xml, "text/xml"));
                console.log(json);
    
                if (json.response.body.items.item !== undefined) {
                    if (json.response.body.items.item.length > 1) 
                        list.push(...json.response.body.items.item);
                    else 
                        list.push(json.response.body.items.item);
                }
    
                if (json.response.body.pageNo * size >= json.response.body.totalCount) {
                    break;
                }   
            }

            date.setMonth(date.getMonth() - 1);
        }

        

        console.log(list);
        pickerChange(clustery, map, list);
        // action(json);

    }
}

async function main() {
    const map = initMap();
    const cityCode = await initCityCode();

    // 마커 클러스터러를 생성합니다 
    const clustery = initClusterer(map);
    

    searchAreaEventSetting(cityCode, await createDataFetch(clustery, map, null));
    


    // ------------------------------

}

main();



