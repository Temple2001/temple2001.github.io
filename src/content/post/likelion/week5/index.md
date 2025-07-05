---
title: 멋사 -  5주차 CRUD 세션
description: Django 프레임워크로 간단한 CRUD를 구현해보기
pubDate: 2024-04-03
tags: ['tmp']
---

# 목차

# 배운 내용 정리

## CRUD

C : Create (데이터 생성)

R : Read (데이터 조회)

U : Update (데이터 수정)

D : Delete (데이터 삭제)

CRUD, HTTP method, SQL 대응 관계는 다음과 같다.

| CRUD | HTTP method | SQL |
| --- | --- | --- |
| Create | POST | INSERT |
| Read | GET | SELECT |
| Update | PUT, PATCH | UPDATE |
| Delete | DELETE | DELETE |

HTTP method에 맞는 CRUD가 호출되면, 그 CRUD에 맞는 SQL을 통해 DB와 상호작용한다.

- **PUT** : 기존에 **데이터가 없다면**, 새롭게 **생성** or 기존에 데이터가 **존재**한다면 데이터 **전체를 수정**
- **PATCH** : 기존에 데이터가 **존재**하는 경우, 그 데이터의 **일부를 수정**

## ORM

**객체**와 **관계형 데이터베이스의 데이터**를 자동으로 **매핑** 해주는 것으로, SQL을 직접 사용하지 않고 프로그래밍 언어를 통해 데이터베이스와 상호작용할 수 있게 해주는 기술이다.

ORM의 장점

1. DBMS에 대한 종속성을 줄일 수 있다. DB를 바꾸더라도 ORM으로 작성된 코드는 그대로 사용 가능하다.
2. SQL injection 공격에 대한 취약점 보완 효과가 있다.

## CRUD in Django

### Request 객체

`views.py` 안의 함수에 파라미터로 전달되는 request 객체는 Django에 의해 자동으로 생성된다.

아래와 같은 요소들을 포함하고 있다.

1. **`request.method`**
    - 요청에 사용된 HTTP method를 나타내는 문자열
2. **`request.body`**
    - HTTP 요청의 본문이 담겨있는 속성
3. **`request.META`**
    - 사용 가능한 모든 HTTP 헤더가 포함된 속성
    - 사용 가능한 HEADER 정보
        - **`CONTENT_LENGTH`**
            
            – 요청 본문의 길이(문자열)
            
        - **`CONTENT_TYPE`**
            
            – 요청 본문의 MIME 유형
            
        - **`HTTP_ACCEPT`**
            
            – 응답에 허용되는 콘텐츠 유형
            
        - **`HTTP_ACCEPT_ENCODING`**
            
            – 응답에 허용되는 인코딩
            
        - **`HTTP_ACCEPT_LANGUAGE`**
            
            – 응답에 허용되는 언어
            
        - **`HTTP_HOST`**
            
            – 클라이언트가 보낸 HTTP 호스트 헤더
            
        - **`HTTP_REFERER`**
            
            – 참조 페이지(있는 경우)
            
        - **`HTTP_USER_AGENT`**
            
            – 클라이언트의 사용자 에이전트 문자열
            
        - **`QUERY_STRING`**
            
            – 단일(구문 분석되지 않은) 문자열인 쿼리 문자열
            
        - **`REMOTE_ADDR`**
            
            – 클라이언트의 IP 주소
            
        - **`REMOTE_HOST`**
            
            – 클라이언트의 호스트 이름
            
        - **`REMOTE_USER`**
            
            – 웹 서버에서 인증된 사용자(있는 경우)
            
        - **`SERVER_NAME`**
            
            – 서버의 호스트 이름
            
        - **`SERVER_PORT`**
            
            – 서버의 포트(문자열)
            
    

[request 객체의 더 많은 속성들이 궁금하다면?](https://docs.djangoproject.com/en/5.0/ref/request-response/#serializing-non-dictionary-objects)

 요소들 중 `request.body` 를 사용하려면 **decode** 과정을 거쳐야 한다.

`request.body` 는 HTTP 요청의 본문을 byte 형태로 가지고 있기 때문에 `decode('utf-8')` 을 이용해 문자열로 변환해야 한다.

그리고 문자열로 변환한 JSON 형식의 데이터를 `json.loads()` 를 사용해 다시 Python 딕셔너리 형태로 변환해 사용한다.

정리 : **Byte → 문자열 → python 딕셔너리**

### Django ORM (QuerySet method)

QuerySet은 Django ORM에서 사용되는 데이터 형식이다. 자세한 내용은 다음과 같다.

1. **`create()`**: 새로운 객체를 생성하고 데이터베이스에 저장한다.
    
    ```python
    **Post.objects.create(
    			title='title', 
    			text='Test'
    			)**
    ```
    
2. **`get()`**: 주어진 조건에 해당하는 단일 객체를 가져온다. 조건에 해당하는 객체가 없거나, 두 개 이상의 객체가 있을 경우 예외를 발생시킨다.
    
    ```python
    **post = Post.objects.get(id=1)**
    ```
    
    - **objects.get()** : 조건에 맞는 객체가 없거나, 둘 이상의 객체가 조건에 맞을 경우 **`DoesNotExist`** 또는 **`MultipleObjectsReturned`** 예외를 발생 시킴.
    - **get_object_or_404()** : 조건에 맞는 객체가 없을 경우, **`DoesNotExist`** 예외 대신 사용자에게 HTTP 404 에러 페이지를 보여줍니다.
    
3. **`all()`**: 해당 모델에 있는 모든 객체를 가져온다.
    
    ```python
    **Post.objects.all()**
    ```
    
4. **`filter()`**: 주어진 조건에 해당하는 객체를 가져온다. 이 메서드는 쿼리셋을 반환한다.
    
    ```python
    **Post.objects.filter(title='title')**
    ```
    
5. **`order_by`** : 주어진 객체를 조건에 따라 정렬한다.
    
    ```python
    **Post.objects.filter(title='title').order_by('created_date')**
    ```
    
6. **`update()`**: 주어진 모든 객체의 필드 값을 업데이트한다.
    
    ```python
    **Post.objects.filter(title='title').update(
    			title='title2', 
    			text='Test2'
    			)**
    ```
    
7. **`delete()`**: 주어진 객체를 삭제한다.
    
    ```python
    **Post.objects.filter(title='title').delete()**
    ```
    

[더 많은 ORM(QuerySet) method들이 궁금하다면?](https://docs.djangoproject.com/en/5.0/ref/models/querysets/)

### QuerySet

**Django ORM 메서드**가 **반환**하는 **데이터의 형식**으로, **Django ORM**에서 사용되는 데이터베이스로부터 전달 받은 **모델의 객체 목록**을 의미하며, 데이터베이스와의 상호작용을 보다 효율적이고 직관적으로 만들어 주기 위한 도구이다.

QuerySet의 특징은 다음과 같다.

1. Lazy Loading
    - 데이터베이스의 **쿼리 실행**을 **실제로 필요로 하는 순간**까지 **지연**시키는 기능이다. 즉, QuerySet을 생성하고 조작해도 바로 데이터베이스에 쿼리를 보내지 않고, 실제로 데이터가 필요한 순간(예: 반복문 사용, 인덱싱 등)에 쿼리를 실행한다.
2. Caching
    - QuerySet이 처음 사용될 때(예: 리스트 변환, 반복 등을 통해) 데이터베이스로부터 데이터를 가져오고, 이 **결과를 내부 캐시에 저장**한다. 이후 **같은 QuerySet에 대한 호출**이 있을 때는 데이터베이스에 **새로운 쿼리를 보내지 않고**, 대신 **내부 캐시에 저장된 데이터를 사용**한다.
    

QuerySet의 특징 예시

```python
post_json_all = []

**post_all = Post.objects.all() 
# 이 순간에는 DB에 쿼리가 전달되지 않아요 !
# 즉, 아직 데이터를 받아오지 않은 상태입니다.**

**for post in post_all: 
# for문에서 사용되는 순간 DB에 쿼리가 전달됩니다.
# 그리고 DB로부터 받아온 데이터가 내부 캐시에 저장됩니다 !**
    post_json = {
        "id": post.id,
        "title" : post.title,
        "writer": post.writer,
        "category": post.category
    }
    post_json_all.append(post_json)
```

## 실습

### Create

```python
import json

@require_http_methods(["POST"])
def **post_list**(request):
    
    if request.method == "POST":
        body = json.loads(request.body.decode('utf-8'))
    
	      # 새로운 데이터를 DB에 생성
        new_post = Post.objects.create(
            writer = body['writer'],
            title = body['title'],
            content = body['content'],
            category = body['category']
        )
    
	      # Response에서 보일 데이터 내용을 Json 형태로 만들어줌
        new_post_json = {
            "id": new_post.id,
            "writer": new_post.writer,
            "title" : new_post.title,
            "content": new_post.content,
            "category": new_post.category
        }

        return JsonResponse({
            'status': 200,
            'message': '게시글 생성 성공',
            'data': new_post_json
        })
```

### Read

**전체 Post 조회**

```python
@require_http_methods(["POST"**, "GET"**])
def **post_list**(request):
    
    if request.method == "POST":
        body = json.loads(request.body.decode('utf-8'))
    
	      # 새로운 데이터를 DB에 생성
        new_post = Post.objects.create(
            writer = body['writer'],
            title = body['title'],
            content = body['content'],
            category = body['category']
        )
    
	      # Response에서 보일 데이터 내용을 Json 형태로 만들어줌
        new_post_json = {
            "id": new_post.id,
            "writer": new_post.writer,
            "title" : new_post.title,
            "content": new_post.content,
            "category": new_post.category
        }

        return JsonResponse({
            'status': 200,
            'message': '게시글 생성 성공',
            'data': new_post_json
        })
        
    **if request.method == "GET":
        post_all = Post.objects.all()
    
				# 각 데이터를 Json 형식으로 변환하여 리스트에 저장
        post_json_all = []
        
        for post in post_all:
            post_json = {
                "id": post.id,
                "title" : post.title,
                "writer": post.writer,
                "category": post.category
            }
            post_json_all.append(post_json)

        return JsonResponse({
            'status': 200,
            'message': '게시글 목록 조회 성공',
            'data': post_json_all
        })**
```

**단일 Post 조회**

```python
@require_http_methods(["GET"])
def **post_detail**(request, id):
		# 요청 메소드가 GET일 때는 게시글을 조회하는 View가 동작하도록 함
    if request.method == "GET":
        post = get_object_or_404(Post, pk=id)
        
        post_json = {
            "id": post.id,
            "writer": post.writer,
            "title" : post.title,
            "content": post.content,
            "category": post.category,
        }

        return JsonResponse({
            'status': 200,
            'message': '게시글 조회 성공',
            'data': post_json
        })
```

### Update

```python
@require_http_methods(["GET"**, "PATCH"**])
def **post_detail**(request, id):

		if request.method == "GET":
        post = get_object_or_404(Post, pk=id)
        
        post_json = {
            "id": post.id,
            "writer": post.writer,
            "title" : post.title,
            "content": post.content,
            "category": post.category,
        }

        return JsonResponse({
            'status': 200,
            'message': '게시글 조회 성공',
            'data': post_json
        })
	
    **if request.method == "PATCH":
        body = json.loads(request.body.decode('utf-8'))
        
        update_post = get_object_or_404(Post, pk=id)

        update_post.title = body['title']
        update_post.content = body['content']
        update_post.category = body['category']
        
        update_post.save()

        update_post_json = {
            "id": update_post.id,
            "writer": update_post.writer,
            "title" : update_post.title,
            "content": update_post.content,
            "category": update_post.category,
        }

        return JsonResponse({
            'status': 200,
            'message': '게시글 수정 성공',
            'data': update_post_json
        })**
```

### Delete

```python
@require_http_methods(["GET", "PATCH"**, "DELETE"**])
def **post_detail**(request, id):

		if request.method == "GET":
        post = get_object_or_404(Post, pk=id)
        
        post_json = {
            "id": post.id,
            "writer": post.writer,
            "title" : post.title,
            "content": post.content,
            "category": post.category,
        }

        return JsonResponse({
            'status': 200,
            'message': '게시글 조회 성공',
            'data': post_json
        })
	
    if request.method == "PATCH":
        body = json.loads(request.body.decode('utf-8'))
        update_post = get_object_or_404(Post, pk=id)

        update_post.content = body['content']
        update_post.save()

        update_post_json = {
            "id": update_post.id,
            "writer": update_post.writer,
            "title" : update_post.title,
            "content": update_post.content,
            "category": update_post.category,
        }

        return JsonResponse({
            'status': 200,
            'message': '게시글 수정 성공',
            'data': update_post_json
        })
        
    **if request.method == "DELETE":
        delete_post = get_object_or_404(Post, pk=id)
        delete_post.delete()

        return JsonResponse({
                'status': 200,
                'message': '게시글 삭제 성공',
                'data': None
        })**
```

# 과제 관련 회고

## Timezone 관련 이슈

이번 과제를 수행하면서 Django 서버 실행 중에 아래와 같은 경고창이 콘솔에 뜬 것을 확인했다.

```bash
... RuntimeWarning: DateTimeField Post.created_at received a naive datetime (2024-03-29 06:26:28.870956) while time zone support is active. ...
```

알아보니 Django에서 다루는 timezone과 python의 `datetime` 모듈에서 다루는 timezone이 다르기 때문이라고 한다.

이번에 게시된지 1주일이 지나지 않은 게시물을 불러오는 과제를 해결하면서 무신경하게 `datetime` 모듈을 import하고 사용했는데, 이 부분이 문제가 된 것 같다.

이 문제를 해결하는 방법은 크게 두 가지이다.

1. `settings.py` 에서 `USE_TZ` 를 False로 수정하여 Django의 timezone support를 끈다.
2. `from django.utils import timezone` 를 사용하여 python의 `datetime` 대신 Django의 `timezone` 을 사용한다.

**첫번째 방법**은 아주 간단하며 Django의 UTC 시간대 대신 우리에게 편한 KST를 사용할 수 있지만, 세계 공통으로 사용되는 UTC를 사용하지 않을 때 오는 패널티를 무시할 수 없다. 

따라서 기왕이면 **두번째 방법**으로 Django가 지원해주는 `timezone` 을 사용하여 시간대를 다룰 때 발생하는 **Side Effects**를 최소화시키는 것이 더 효과적일 것이다.

## Field Lookup

Django의 Field Lookup은 SQL의 **WHERE** 절을 나타낼 수 있는 기능이다.

`filter()` , `exclude()` , `get()` 메서드에서 사용 가능하다.

아래는 자주 사용되는 Lookup Type이다.

1. **contains**

해당 값을 **포함한다**

```python
Entry.objects.get(headline__contains="Lennon")
```

```sql
SELECT ... WHERE headline LIKE '%Lennon%';
```

1. **gt**

해당 값보다 **크다**

```python
Entry.objects.filter(id__gt=4)
```

```sql
SELECT ... WHERE id > 4;
```

1. **gte**

해당 값보다 **크거나 같다**

```python
Entry.objects.filter(id__gte=4)
```

```sql
SELECT ... WHERE id >= 4;
```

1. **lt**

해당 값보다 **작다**

1. **lte**

해당 값보다 **작거나 같다**

# 후기

이번 세션에서는 백엔드의 기본 골격인 CRUD에 대해서 학습하였다.

Django ORM에서 QuerySet이라는 데이터 형식을 알게 되었는데, Lazy Loading이라는 특징이 굉장히 독특하다고 느껴졌다. 그래서 여러가지로 Lazy Loading에 대해 알아보던 도중 Lazy Loading이 장점만 가진 특징은 아니라는 것을 알게 되었다. 주로 **N+1 문제**에 관한 이야기가 많이 보이던데, 중간고사 이후에 조사해볼 예정이다.

그리고 이번 세션 과제 중 Challenge 과제에서 Post 모델에 구현한 이미지 Field를 눈으로 확인할 수 있게 하기 위해 HTML 템플릿으로 실제 블로그 게시글처럼 보여주는 ~~쌩쇼~~를 해보았는데, 오랜만에 해보는 프론트엔드 작업이라 **정-말** 힘들었지만 막상 힘들게 만든 결과물을 보니 뿌듯하기도 했고, 기억에서 잊혀질 뻔한 내 예전 실력을 어느정도 복구할 수 있는 좋은 경험이었던 것 같다.