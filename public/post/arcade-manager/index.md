---
title: Arcade Manager 제작기
description: 디스코드 봇을 이용해 오락실의 유튜브 Live 방송을 손쉽게 기록할 수 있는 프로그램을 제작하였습니다.
pubDate: 2023-03-05
tags: ['구현', 'Discord', 'Python', 'Flask', 'React', 'MongoDB', 'Youtube API']
---

> 현재 이 글은 작성중입니다.

# 목차

# 제작 동기

나는 틈만 나면 친구들과 오락실에 가서 리듬게임을 플레이하곤 한다.

내가 자주 가는 오락실은 나처럼 리듬게임을 자주 플레이하는 사람들을 위해 오락실 전용 유튜브 채널을 개설하고, 몇몇 게임기에 방송 장비를 설치해 거의 24시간 내내 라이브 방송을 스트리밍 하여 자신의 플레이 모습을 다시 볼 수 있도록 하고 있다.

![다양한 리듬게임이 모여있는 '노량진 어뮤즈타운'](https://fastly.4sqi.net/img/general/1116x400/406903573_TTnIbMTaFuDf9irkZfBkF3Dso0MImU3jD5FwAmOGfew.jpg)

나와 친구들도 이 유튜브 채널을 자주 사용하고 있는데, 문제점이 있다면 매일 갱신되는 수많은 라이브 방송 중에 자신이 플레이한 모습이 있는 영상을 찾는 것이 꽤 어렵다는 것이다.

매번 오락실을 갈 때마다 언제부터 플레이했는지 메모하는 방법도 어렵고, 해당 라이브 영상에 좋아요 표시를 해 자신의 유튜브 계정에 남겨놓는 방법도 몇시부터 플레이했는지는 저장되지 않기 때문에 여러모로 애로 사항이 많다.

![노량진 어뮤즈타운 공식 유튜브의 실시간 스트리밍 화면](amusetownlive.png)

나는 이런 불편함을 어떻게 하면 해소할 수 있을지 계속 고민하고 있었고, 친구들끼리 많이 이용하는 메신저인 디스코드를 이용한 프로젝트를 하나 생각하게 되었다.

디스코드에 봇을 하나 만들고, 봇에게 내가 원하는 게임의 타임체크를 요청하면 봇은 그 게임에 해당하는 라이브 방송을 찾아 현재시간과 일치하는 그 라이브 영상의 재생시간을 영상의 정보와 함께 데이터베이스에 저장한다.

그리고 그 데이터베이스의 정보들을 정리하여 웹페이지에 보여주면 사용자들이 디스코드에 단순히 채팅을 친 것만으로 자신이 언제 오락실에서 게임을 했는지 기록할 수 있을 것이다.

또 오락실 영상을 한눈에 볼 수 있도록 모아주는 효과는 덤이다.

# 준비 과정

## 백엔드

백엔드에서는 아래의 순서대로 작업이 이루어질 것이다.

1. 디스코드 봇이 사용자에게 요청을 받는다.
2. 요청받은 정보대로 Youtube Data API를 이용해 현재시간과 일치하는 영상의 재생시간과 기타 영상 정보들을 받아온다.
3. 받아온 정보를 DB에 저장한다.
4. API 서버가 웹페이지에 사용될 DB의 정보들을 보낸다. (항상 진행중)

따라서 아래와 같은 코드가 필요하다.

- 디스코드 봇을 운영하는 코드
- Youtube Data API를 이용하는 코드
- DB에서 데이터를 읽고 쓰는 코드
- API 서버를 운영하는 코드

디스코드를 다루는 부분은 [discord.py](https://github.com/Rapptz/discord.py)가 이미 잘 만들어져 있어 이를 중심으로 만들 것이다.

DB는 서비스에서 다룰 데이터들이 복잡하지 않기 때문에, 다루기 쉬운 NoSQL를 써도 괜찮을 것 같아 MongoDB를 사용할 것이다.

API 서버는 Flask를 이용해서 만들 것이다.

## 프론트엔드

페이지가 단 하나만 필요하기 때문에 순수 React + js로 구현할 것이다.

그리고 [styled-components](https://styled-components.com/)를 이용해 별도의 css 파일 없이 컴포넌트 코드 안에서 스타일을 정의하는 방법을 사용할 것이다.

# 코드 설명

## 백엔드 코드

[Github 링크](https://github.com/Temple2001/arcade-manager/tree/main/backend_python)

### api_server.py

[GitHub 링크](https://github.com/Temple2001/arcade-manager/blob/main/backend_python/api_server.py)

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from db_api import MongoDB_API

app = Flask(__name__)
CORS(app, resources={r'*':{'origins': '*' }})
#app.debug = True
app.config['JSON_AS_ASCII'] = False
db_api = MongoDB_API()

@app.route('/log-data', methods=['GET', 'POST'])
def main_page():
    if request.method == 'GET':
        res = list(db_api.find_log())
        for data in res:
            data['log_time'] = str(data['log_time']).split('.', 2)[0]
        return jsonify(res)

    if request.method == 'POST':
        user_name = request.args.get('username')
        v_id = request.args.get('vid')
        progress_time = request.args.get('time')
        arcade_type = request.args.get('type')

        db_api.add_log(user_name, v_id, progress_time, arcade_type)
        return jsonify({'msg': 'Insert Completed'})
```

GET 요청을 받으면 DB에서 받은 데이터를 반환하고 POST 요청을 받으면 요청에 포함된 데이터로 DB에 데이터를 새로 저장하는 API의 코드이다.

### db_api.py

[GitHub 링크](https://github.com/Temple2001/arcade-manager/blob/main/backend_python/db_api.py)

```python
from pymongo import MongoClient
import datetime
import traceback
from dotenv import load_dotenv
import os

class MongoDB_API:
    def __init__(self):
        load_dotenv(verbose=True)
        self.MONGO_PWD = os.getenv('MONGO_PWD')
        self.client = MongoClient(f'mongodb://temple:{self.MONGO_PWD}@localhost:27017/ArcadeData')
        self.log_db = self.client['ArcadeData']['log']

    def add_log(self, user_name, v_id, progress_time, arcade_type):
        try:
            content = {
                'log_time': datetime.datetime.utcnow(),
                'user_name': user_name,
                'v_id': v_id,
                'check_time': progress_time,
                'arcade_type': arcade_type,
            }
            post_id = self.log_db.insert_one(content).inserted_id
            print(f'[OK] 새 데이터가 등록되었습니다. post_id : "{post_id}"')
            return None
        except:
            print(f'[Error] DB 데이터 추가 에러\n{traceback.format_exc()}')
            return '[Failed] DB 데이터 추가 실패'

    def find_log(self):
        return self.log_db.find({}, {'_id': False}).sort('log_time')
```

DB에 데이터(log)를 추가하거나 모든 데이터를 반환하는 코드이다.

### youtube_api.py

[GitHub 링크](https://github.com/Temple2001/arcade-manager/blob/main/backend_python/youtube_api.py)

```python
import requests
import json
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from urllib.parse import urlparse, parse_qs
import traceback

class YoutubeAPI:

    def __init__(self):
        load_dotenv(verbose=True)
        self.API_KEY = os.getenv('API_KEY')

    def find_video(self, keyword):
        params = {
            'q': keyword,
            'part': 'snippet',
            'key': self.API_KEY,
            'maxResults': 3,
            'type': 'video',
            'order': 'date',
        }

        response = requests.get('https://www.googleapis.com/youtube/v3/search', params=params)
        res_json = response.json()
        if response.status_code != 200:
            print('[Error] find_video 에러, 생방송 video를 찾지 못함.')
            print(json.dumps(res_json, indent=2))
            return None, '[Failed] 해당 생방송 video를 찾지 못했습니다.'

        search_list = res_json['items']
        for video in search_list:
            if video['snippet']['liveBroadcastContent'] == 'live':
                return video['id']['videoId'], None
        return None, '[Failed] 해당 생방송 video를 찾지 못했습니다.'

    def url_parse(self, url):
        try:
            parsed_url = urlparse(url)
            v_id = parse_qs(parsed_url.query)['v'][0]
            return v_id, None
        except:
            print(f'[Error] urlparse 에러\n{traceback.format_exc()}')
            return None, '[Failed] 올바른 URL을 입력하세요.'

    def time_check(self, v_id):
        try:
            params = {
                'part': 'snippet',
                'id': v_id,
                'key': self.API_KEY,
            }

            response = requests.get('https://www.googleapis.com/youtube/v3/videos', params=params)
            res_json = response.json()

            start_time_utc = res_json['items'][0]['snippet']['publishedAt']

            start_time_utc = datetime.strptime(start_time_utc, '%Y-%m-%dT%H:%M:%SZ')
            progress_time = str(datetime.now() - start_time_utc).split('.', 2)[0]
            return progress_time, None
        except:
            print(f'[Error] API 호출 에러\n{traceback.format_exc()}')
            return None, '[Failed] 유효하지 않은 동영상입니다.'
```

Youtube 공식 API를 이용해 키워드로 생방송 영상을 검색해 비디오 ID를 찾고 그 ID를 가진 생방송 영상의 진행률(몇시간 몇분 몇초)을 찾는 코드이다.

### bot.py

[GitHub 링크](https://github.com/Temple2001/arcade-manager/blob/main/backend_python/bot.py)

## 프론트엔드 코드

[Github 링크](https://github.com/Temple2001/arcade-manager/tree/main/frontend_reactjs)

# 후기

## 어려웠던 점

### CORS 문제

페이지에서 python으로 만든 API server에 요청을 보내고 결과를 받을 때 `"~ has been blocked by CORS policy: ~"`라는 에러가 발생해 개발이 지체되었던 적이 있었다.

CORS 에러에 대해 간단히 설명하자면 **다른 출처**의 자원을 요청하는 상황을 CORS(Cross Origin Resource Sharing)라고 하는데, 대부분의 기본적인 환경에서는 이런 CORS를 차단한다. 이럴 때 위와 같은 CORS 에러가 발생하게 된다.

**다른 출처**는 다음의 3가지 조건이 하나라도 다른 것을 말한다.

- 프로토콜 (ex : http or https)
- 호스트 (ex : naver.com or google.com)
- 포트번호 (ex : :80 or :443)

---

따라서 문제를 해결하기 위해서는

1. 서버에서 `Access-Control-Allow-Origin` 헤더를 세팅하고 브라우저에 응답을 보내 예외를 설정하거나
2. 프론트 단에서 프록시 서버를 이용해 동일한 출처에서 요청을 보내는 것처럼 만드는 방법이 있다.

후자는 다른 서비스를 끌어다 써와야 하므로 많이 번거롭기 때문에 서버에서 `Access-Control-Allow-Origin` 헤더를 설정하는 방법으로 결정했다.

아래는 Flask의 `Access-Control-Allow-Origin` 헤더 적용 코드이다.

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r'*':{'origins': '*' }})     # '*'을 사용해 예외 없이 모든 경우에서 호출 허용

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=1219)
```

사실 위와 같이 예외 없이 모든 경우에서 호출을 허용하게 되면 **심각한 보안 문제**를 발생시킬 수 있으므로 여러 사람들에게 공개된 서비스에서는 사용하지 말아야 한다.

### DB 해킹 사건

테스트 중에 MongoDB가 해킹을 당하는 사고가 발생하였다...

당시 나는 MongoDB가 위치한 서버의 방화벽을 모든 IP에 대해 개방한 상태였고, MongoDB는 별도의 설정을 해놓지 않는다면 접근하는 모든 이들이 DB를 만질 수 있도록 열려있게 된다.

```yaml
# 'mongod.conf' 구성 파일에서 security 부분을 아래와 같이 설정해야 한다.
security:
  authorization: enabled
```

나는 애석하게도 MongoDB에 별도의 설정을 해두지 않았고, 따라서 내 서버의 IP를 안다면 언제든지 MongoDB에 접근할 수 있게 되는 것이다.
그리고 테스트를 한지 이틀만에 내 DB는 공격을 받게 된다. <del>바본가</del>

다행히 테스트 중인 DB 안에 민감한 정보는 없었고 빠르게 대처하여 후속 피해는 없었지만 인생 처음으로 당한 해킹이다 보니 충격이 어마어마했다...

보안에 관한 문제는 시간이 걸려도 신중히 접근해야 한다는 교훈을 깨닫게 된 것 같다.

## 개선하고 싶은 점

### DB 관리

이번 프로젝트에서는 DB를 한번 직접 사용해보고 싶어서 MongoDB를 이용해 개발을 진행했는데, 앞서 말했던 DB 해킹 사건도 그렇고 DB를 구성하고 관리하는데에 드는 시간과 비용이 안에 담긴 데이터의 가치보다 더 크다고 느꼈다.

물론 MongoDB도 NoSQl DB로 기본 SQL DB보다 훨씬 가볍고 간단한 DB에 속하지만, 데이터 컬럼 개수가 5개밖에 없는 이 프로젝트의 환경에서는 닭 잡는 데에 소 잡는 칼을 쓰는 격이라고 생각했다.

최근에 찾은 DB 서비스 중에 [Firebase](https://firebase.google.com/?hl=ko)라는 것을 찾았는데,

1. 서버리스 서비스라 서버를 따로 구하지 않아도 된다
2. 자체적으로 백엔드 기능을 가지고 있어 백엔드 구현이 필요가 없다(적어도 이 프로젝트에서는)
3. 한글 문서가 있다 (매우 중요)

같은 다양한 장점들이 있어 만약 차후에 소규모 데이터를 다루는 프로젝트를 진행한다면 적극적으로 사용해 볼 의향이 생겼다.
