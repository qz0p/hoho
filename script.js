// API 키 설정
const WEATHER_API_KEY = '4608f337f9e449e883e125134240711'; // weatherapi.com에서 발급받은 키
const NEIS_API_KEY = 'e1e6f9bb23774cc2841e3ea20e47b495'; // NEIS에서 발급받은 키

// 현재 날짜 가져오기
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    document.getElementById('current-date').textContent = 
        `${year}년 ${month}월 ${day}일`;
    
    return `${year}${month}${day}`;
}

// 날씨 정보 가져오기
async function getWeatherData(position) {
    const { latitude, longitude } = position.coords;
    
    try {
        const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?` +
            `key=${WEATHER_API_KEY}&q=${latitude},${longitude}&lang=ko`
        );

        if (!response.ok) throw new Error('날씨 정보를 가져오는데 실패했습니다');

        const data = await response.json();
        console.log('날씨 데이터:', data);

        updateWeatherUI(data);
    } catch (error) {
        console.error('날씨 API 에러:', error);
        alert('날씨 정보를 가져오는데 실패했습니다');
    }
}

// 날씨 UI 업데이트
function updateWeatherUI(data) {
    document.getElementById('location').textContent = 
        `${data.location.region} ${data.location.name}`;
    document.getElementById('temp').textContent = 
        Math.round(data.current.temp_c);
    document.getElementById('feels-like').textContent = 
        `${Math.round(data.current.feelslike_c)}°C`;
    document.getElementById('humidity').textContent = 
        `${data.current.humidity}%`;
    document.getElementById('weather-icon').src = 
        `https:${data.current.condition.icon}`;
}

// 급식 정보 가져오기
async function getMealInfo(eduCode, schoolCode) {
    try {
        const today = getCurrentDate();
        const response = await fetch(
            `https://open.neis.go.kr/hub/mealServiceDietInfo` +
            `?KEY=${NEIS_API_KEY}` +
            `&Type=json` +
            `&ATPT_OFCDC_SC_CODE=${eduCode}` +
            `&SD_SCHUL_CODE=${schoolCode}` +
            `&MLSV_YMD=${today}`
        );

        const data = await response.json();
        console.log('급식 데이터:', data);

        // 급식 정보 초기화
        document.getElementById('lunch-menu').innerHTML = '급식 정보가 없습니다.';
        document.getElementById('dinner-menu').innerHTML = '급식 정보가 없습니다.';

        if (data.RESULT?.CODE === 'INFO-200') {
            // 급식 정보가 없는 경우
            return;
        }

        if (data.mealServiceDietInfo?.[1]?.row) {
            const meals = data.mealServiceDietInfo[1].row;
            meals.forEach(meal => {
                const menuList = meal.DDISH_NM.split('<br/>');
                const formattedMenu = menuList.map(item => {
                    return item.replace(/\([0-9\.]+\)/g, '');
                }).join('<br>');

                if (meal.MMEAL_SC_CODE === "2") { // 중식
                    document.getElementById('lunch-menu').innerHTML = formattedMenu;
                } else if (meal.MMEAL_SC_CODE === "3") { // 석식
                    document.getElementById('dinner-menu').innerHTML = formattedMenu;
                }
            });
        }
    } catch (error) {
        console.error('급식 정보 에러:', error);
        alert('급식 정보를 가져오는데 실패했습니다');
    }
}

// 학교 검색
async function searchSchool() {
    const schoolName = document.getElementById('school-search').value;
    if (!schoolName) {
        alert('학교명을 입력해주세요');
        return;
    }

    try {
        const response = await fetch(
            `https://open.neis.go.kr/hub/schoolInfo` +
            `?KEY=${NEIS_API_KEY}` +
            `&Type=json` +
            `&SCHUL_NM=${encodeURIComponent(schoolName)}`
        );

        const data = await response.json();
        console.log('학교 검색 결과:', data);

        if (data.RESULT?.CODE === 'INFO-200') {
            alert('검색된 학교가 없습니다');
            return;
        }

        if (data.schoolInfo?.[1]?.row) {
            displaySchoolList(data.schoolInfo[1].row);
        }
    } catch (error) {
        console.error('학교 검색 에러:', error);
        alert('학교 검색에 실패했습니다');
    }
}

// 학교 목록 표시
function displaySchoolList(schools) {
    const selectHtml = `
        <select id="school-select" style="margin: 10px 0;">
            <option value="">학교를 선택하세요</option>
            ${schools.map(school => `
                <option value="${school.ATPT_OFCDC_SC_CODE},${school.SD_SCHUL_CODE}">
                    ${school.SCHUL_NM} (${school.LCTN_SC_NM})
                </option>
            `).join('')}
        </select>
    `;

    const searchContainer = document.querySelector('.school-select');
    searchContainer.insertAdjacentHTML('beforeend', selectHtml);

    // 선택창 이벤트 리스너 추가
    document.getElementById('school-select').addEventListener('change', async function() {
        const value = this.value;
        if (value) {
            const [eduCode, schoolCode] = value.split(',');
            await getMealInfo(eduCode, schoolCode);
        }
    });
}

// 위치 정보 가져오기
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // 성공 콜백
            async (position) => {
                const { latitude, longitude } = position.coords;
                console.log('현재 위치:', { latitude, longitude });
                getWeatherData({ coords: { latitude, longitude } });
            },
            // 실패 콜백
            (error) => {
                console.error('위치 정보를 가져오는데 실패했습니다:', error);
                alert('위치 정보를 가져오는데 실패했습니다');
            }
        );
    } else {
        console.error('Geolocation is not supported by this browser.');
        alert('Geolocation is not supported by this browser.');
    }
}

// 초기화
function init() {
    getLocation();
}

// 초기화 함수 호출
init(); 