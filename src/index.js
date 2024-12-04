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
    const response = await fetch('./src/cityCode.json');
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

    const search = () => {
        // 검색
        const input = searchInput.value.replaceAll(" ", "");
        const jamo = textToJamo(input);
        const code = trie.search(jamo);
        if (code !== '' && cityCode[code] !== undefined) {
            dataFetch(cityCode[code], code);
            renderAutoComplete([]);
        }
    }

    // 키보드 이벤트 핸들러
    const handleKeyboardNavigation = (event) => {
        const keyActions = {
            'Enter': () => {
                if (autoCompleteManager.getSelectedItem() === null) {
                    search();
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
    searchButton.addEventListener('click', search);

    // 가격 슬라이더 이벤트
    document.querySelector('#price-slider').addEventListener('input', (e) => {
        document.querySelector('#price-slider-value').innerText = parseFloat(e.target.value) / 10 + '억';
    });
}

function setMapView(cityCode, map) {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(cityCode, function(result, status) {
        // 정상적으로 검색이 완료됐으면 
        if (status === kakao.maps.services.Status.OK) {
            const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
            map.setCenter(coords);
            map.setLevel(7);
        }
    });
}

const noticeFadeOut = (() => {
    let prev = null;

    return (notice) => {
        // hidden 제거하고 투명도 설정
        notice.classList.remove('hidden');
        
        notice.classList.remove('opacity-0');
        notice.classList.add('opacity-100');

        if (prev !== null) prev.cancel();

        const fadeOut = (() => {
            let can = true;

            const run = () => {
                setTimeout(() => {
                    if (!can) return;
                    notice.classList.remove('opacity-100');
                    notice.classList.add('opacity-0');
                    // transition이 완료된 후 hidden 추가
                    setTimeout(() => {
                        if (!can) return;
                        notice.classList.add('hidden');
                    }, 1000); // transition-duration과 동일한 시간
                }, 2000);
            }

            return {
                run,
                cancel: () => can = false
            }
        })();
        
        // 2초 후 페이드 아웃
        fadeOut.run();
        prev = fadeOut;
    }
})();

function bookmarkEventSetting(map, clusterer, coords, marker) {
    // 마커를 누를때마다 이벤트를 갱신해야 하기 때문에 onclick으로 설정
    document.querySelector('#bookmark-button').onclick = () => {
        const panel = document.querySelector('#information');
        if (document.querySelector('#bookmark-list').innerHTML.includes(panel.querySelector('#address').innerText)) {

            document.querySelector('#bookmark-notice-add-success').classList.add('hidden');
            const notice = document.querySelector('#bookmark-notice-add-fail');
            noticeFadeOut(notice);
            return;
        } 

        const itemHtml = `
        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-lg">${panel.querySelector('#address').innerText}</h3>
                    <p class="text-gray-500 text-sm mt-1">아파트 · ${panel.querySelector('#sizeOfmeter').innerText} · ${panel.querySelector('#floor').innerText} · ${panel.querySelector('#apt').innerText}</p>
                    <p class="text-custom font-bold mt-2">${panel.querySelector('#price').innerText}</p>
                    <p class="text-gray-500 text-sm">${panel.querySelector('#date').innerText} 거래</p>
                </div>
                <button class="text-gray-400 hover:text-red-600">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;

        const item = document.createRange().createContextualFragment(itemHtml);
        document.querySelector('#bookmark-list').appendChild(item);
        const addedItem = document.querySelector('#bookmark-list').lastElementChild;
        addedItem.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation();
            addedItem.remove()
        });

        console.log(coords);
        addedItem.onclick = () => {
            map.setCenter(coords);
            clusterer.addMarker(marker);
            kakao.maps.event.trigger(marker, 'mouseover');
            kakao.maps.event.trigger(marker, 'click');
            
        };


        document.querySelector('#bookmark-notice-add-fail').classList.add('hidden');
        const notice = document.querySelector('#bookmark-notice-add-success');
        noticeFadeOut(notice);
    };
}


function priceFormat(priceNum) {
    const price = parseInt(priceNum.replace(/,/g, ''));
    return price > 10000 ? `${Math.floor(price / 10000)}억 ${(price % 10000).toLocaleString()}만원` : `${price.toLocaleString()}만원`;
}

function createMarkerClickEvent(data, list, map, clusterer, coords, marker) { 
    return () => {
        const panel = document.querySelector('#information');


        panel.querySelector('#apt').innerText = data.aptNm
        panel.querySelector('#address').innerText = `${data.estateAgentSggNm} ${data.roadNm} ${parseInt(data.roadNmBonbun)}`
        panel.querySelector('#price').innerText = priceFormat(data.dealAmount);

        const date = new Date(data.dealYear, data.dealMonth - 1, data.dealDay);
        const formatDate = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
        panel.querySelector('#date').innerText = formatDate;

        panel.querySelector('#sizeOfmeter').innerText = `${parseFloat(data.excluUseAr).toFixed(2)}㎡`;
        panel.querySelector('#sizeOfpyeong').innerText = `(${parseFloat(data.excluUseAr * 0.3025).toFixed(1)}평)`;

        panel.querySelector('#floor').innerText = `${data.floor}층`;
        panel.querySelector('#buildYear').innerText = `${data.buildYear}년`;
        panel.querySelector('#slerGbn').innerText = data.slerGbn;

        document.querySelector('#around1').classList.add('hidden');
        document.querySelector('#around2').classList.add('hidden');

        console.log(list);

        if (list.length >= 1) {
            panel.querySelector('#around-name1').innerText = list[0].aptNm;
            panel.querySelector('#around-size-floor1').innerText = `${parseFloat(list[0].excluUseAr).toFixed(2)}㎡ / ${list[0].floor}층`;
            panel.querySelector('#around-price1').innerText = priceFormat(list[0].dealAmount);

            const date1 = new Date(list[0].dealYear, list[0].dealMonth - 1, list[0].dealDay);
            panel.querySelector('#around-date1').innerText = `${date1.getFullYear()}.${(date1.getMonth() + 1).toString().padStart(2, '0')}.${date1.getDate().toString().padStart(2, '0')}`;
            document.querySelector('#around1').classList.remove('hidden');
        }

        if (list.length >= 2) { 
            panel.querySelector('#around-name2').innerText = list[1].aptNm;
            panel.querySelector('#around-size-floor2').innerText = `${parseFloat(list[1].excluUseAr).toFixed(2)}㎡ / ${list[1].floor}층`;
            panel.querySelector('#around-price2').innerText = priceFormat(list[1].dealAmount);

            const date2 = new Date(list[1].dealYear, list[1].dealMonth - 1, list[1].dealDay);
            panel.querySelector('#around-date2').innerText = `${date2.getFullYear()}.${(date2.getMonth() + 1).toString().padStart(2, '0')}.${date2.getDate().toString().padStart(2, '0')}`;
            document.querySelector('#around2').classList.remove('hidden');
        }

        bookmarkEventSetting(map, clusterer, coords, marker);
        document.querySelector('#information-button').click();
    };
}


function pickerChange(clusterer, map, arr) {
    clusterer.clear();
    
    /*
     * 같은 건물의 여러개의 거래 데이터가 있다면 한개만 표시되는 문제가 있음.
     */

    // estateAgentSggNm(시군구) + umdNm(동) + roadNm(도로명) + roadNmBonbun(건물 코드)

    const curryCreateMarkerClickEvent = ((clusterer, map, arr) => 
                                            (item, coords, marker) => 
                                                createMarkerClickEvent(item, arr, map, clusterer, coords, marker))(clusterer, map, arr);

    arr.forEach((item) => {
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.addressSearch(`${item.estateAgentSggNm} ${item.umdNm} ${item.roadNm} ${parseInt(item.roadNmBonbun)}`, function(result, status) {
            // 정상적으로 검색이 완료됐으면 
             if (status === kakao.maps.services.Status.OK) {
        
                const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
        
                // 결과값으로 받은 위치를 마커로 표시합니다
                const marker = new kakao.maps.Marker({
                    position: coords
                });
                
                clusterer.addMarker(marker);

                const infowindow = new kakao.maps.InfoWindow({
                    content : `<div class="flex flex-col items-center">
                                    <div class="bg-white shadow-lg w-36 rounded-xl p-3 mb-2 transition-transform transform group-hover:scale-105 backdrop-blur-sm bg-opacity-95">
                                        <div class="text-sm font-medium">${item.aptNm}</div>
                                        <div class="text-blue-500 font-bold text-lg">${priceFormat(item.dealAmount).slice(0, -2)}</div>
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
                
                kakao.maps.event.addListener(marker, 'click', curryCreateMarkerClickEvent(item, coords, marker));
            } 
        });
    });
}

async function createDataFetch(clustery, map) {
    return async (cityCode, cityName) => {
        const size = 1000;
        const url = `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev?LAWD_CD=${cityCode}&numOfRows=${size}&serviceKey=bMwwNr1uwE0kwt%2BQ5tCxjvNwBHQL0bIaJiBfd31z8vIvj5gcagERlUf6Pw0J%2BmQWhyjCNsednMfHyLI2U0TTfA%3D%3D`;

        const list = [];

        const periodSetting = document.querySelector('#period').value;
        const period = periodSetting === '기간' ? 0 : parseInt(periodSetting.slice(0, -2));

        const today = new Date();
        const start = new Date(today.setMonth(today.getMonth() - period));
        const date = new Date();

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

        const priceFilter = document.querySelector('#price-slider').value * 1000;
        const extentSetting = document.querySelector('#extent').value;
        const extentFilter = extentSetting === '방크기' ? 0x7f7f7f7f : parseInt(extentSetting.slice(0, -1)) * 3.30579;
        
        setMapView(cityName, map);
        pickerChange(clustery, map, list.filter((item) =>  parseInt(item.dealAmount.replace(/,/g, '')) < priceFilter && parseFloat(item.excluUseAr) < extentFilter));
    }
}

function rightPanelEventSetting() {
    document.querySelector('#rightPanelCloseButton').addEventListener('click', () => {
        document.querySelector('#information').classList.add('hidden');
    });

    function makeHighlightChange(action) {
         return (e) => {
            const tabBar = document.querySelectorAll('#tab-bar > div > div');
            tabBar.forEach((item) => item.classList.add('hidden'));
            e.target.parentElement.querySelector('div').classList.remove('hidden');
            
            const contentList = document.querySelectorAll('#content > div');
            contentList.forEach((item) => item.classList.add('hidden'));
            action();
        }
    }

    document.querySelector('#information-button').addEventListener('click', makeHighlightChange(() => {
        if (document.querySelector('#apt').innerText === '') return;
        document.querySelector('#information').classList.remove('hidden');
    }));

    document.querySelector('#bookmark-area-button').addEventListener('click', makeHighlightChange(() => {
        document.querySelector('#bookmark').classList.remove('hidden');
    }));
}



async function main() {
    window.onload = () => document.querySelector('#price-slider').value = 50;
    const map = initMap();
    const cityCode = await initCityCode();
    const clustery = initClusterer(map);

    searchAreaEventSetting(cityCode, await createDataFetch(clustery, map));
    rightPanelEventSetting();


}

main();



