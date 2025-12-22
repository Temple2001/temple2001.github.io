---
title: 코딩테스트를 위한 Python to Java 전환기
description: 코딩테스트를 위해 익숙했던 Python에서 Java로 넘어가기 위한 준비
pubDate: 2025-09-02
tags: [리서치, 코딩테스트, Python, Java]
blind: true
---

# 목차

# 개요
본격적으로 취업 준비를 하던 도중 코딩테스트에 대한 걱정이 생겼다.

지금까지 알고리즘 문제 해결 연습은 꾸준히 하고 있었지만, 항상 Python으로 해결하고 있었다.

Python은 내가 많이 사용한 언어이기도 하지만 직관적이고 간단한 코드 스타일 덕분에 문제에 더 집중할 수 있었기 때문이다.

하지만 최근 들어 백엔드 채용을 진행하는 많은 회사들이 Java만으로 코딩테스트를 해결하길 원하고 있다는 느낌을 받았다.

Java도 지금까지 프로젝트 활동을 이어가며 많이 사용했지만, Spring Boot 프레임워크를 사용하기 위한 코딩과 코딩테스트를 위한 코딩은 매우 큰 차이가 있다고 생각했기에 이를 위한 준비가 필요하다고 느꼈다.

그래서 지금까지 익숙했던 Python 문법을 Java 문법으로 어떻게 변환해야 하는지 정리해보려고 한다.

# 입출력

|Python|Java|
|-|-|
|input = sys.stdin.readline|BufferedReader br = new BufferedReader(new InputStreamReader(System.in));|
|data = input().split()|StringTokenizer st = new StringTokenizer(br.readLine());
|print()|System.out.println() (많이 출력할 땐 StringBuilder 필수)|

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine()); // 공백 기준 분리

        int N = Integer.parseInt(st.nextToken()); // 하나씩 가져오기
        int M = Integer.parseInt(st.nextToken());
        
        // 출력 모으기 (속도 최적화)
        StringBuilder sb = new StringBuilder();
        sb.append(N).append(" ").append(M);
        System.out.println(sb);
    }
}
```

대부분의 회사가 채용 과정 중 **프로그래머스**를 코딩테스트 환경으로 사용하기 때문에 입출력에 큰 신경을 쓰지 않아도 되긴 하지만, 그래도 핵심적인 요소이고 삼성같은 예외 상황도 존재하기에 정리하려고 한다.

## 입력

Python에서는 `input()`으로 입력을 받으며, 더 빠른 실행속도를 위해 `input = lambda: sys.stdin.readline().rstrip()` 처럼 sys의 readline을 사용하도록 하는 경우가 많다.

Java는 기본적으로 `Scanner`를 사용하여 입력을 받지만 성능이 나빠 코딩테스트 환경에서는 사용하지 않는다. 대신 `BufferedReader`를 사용하여 입력을 받는다.

`BufferedReader br = new BufferedReader(new InputStreamReader(System.in));`로 생성한 `BufferedReader` 인스턴스의 `br.readline()` 메서드를 호출하여 입력을 한 줄 씩 읽을 수 있다.

만약 split이 필요하다면 `StringTokenizer st = new StringTokenizer(br.readLine());` 처럼 `StringTokenzier`로 입력을 감싼 뒤 `st.nextToken()` 메서드를 호출하여 split된 입력을 하나씩 가져올 수 있다.

## 출력

출력은 역시 `System.out.println()`을 많이 쓰지만, 출력을 연속적으로 여러번 해야 하는 상황이라면 `StringBuilder`를 사용해야 한다.

`StringBuilder sb = new StringBuilder();`로 생성한 `StringBuilder` 인스턴스의 `append()` 메서드를 사용하여 출력할 텍스트들을 모으고 이후에 한번에 출력할 수 있다.

# 문자열

## 문자열 관련 기능
| 기능 | Python | Java |
| :--- | :--- | :--- |
| **길이** | `len(s)` | `s.length()` |
| **특정 문자 접근** | `s[i]` | `s.charAt(i)` |
| **문자열 비교** | `s == "abc"` | `s.equals("abc")` |
| **문자열 합치기** | `s1 + s2` | `s1 + s2` |

| 기능 | Python | Java |
| :--- | :--- | :--- |
| **포함 여부** | `"a" in s` | `s.contains("a")` |
| **시작 문자** | `s.startswith("a")` | `s.startsWith("a")` |
| **끝 문자** | `s.endswith("a")` | `s.endsWith("a")` |
| **인덱스 찾기** | `s.find("a")` | `s.indexOf("a")` |
| **빈 문자열 확인**| `not s` | `s.isEmpty()` |

| 기능 | Python | Java |
| :--- | :--- | :--- |
| **자르기 (Slicing)** | `s[1:4]` | `s.substring(1, 4)` |
| **끝까지 자르기** | `s[1:]` | `s.substring(1)` |
| **문자열 분리** | `s.split(" ")` | `s.split(" ")` |
| **문자열 치환** | `s.replace("a", "b")` | `s.replace("a", "b")` |
| **대소문자 변환** | `s.upper()` / `s.lower()` | `s.toUpperCase()` / `s.toLowerCase()` |
| **공백 제거** | `s.strip()` | `s.trim()` 또는 `s.strip()` |

| 기능 | Python | Java |
| :--- | :--- | :--- |
| **문자열 → 정수** | `int(s)` | `Integer.parseInt(s)` |
| **정수 → 문자열** | `str(n)` | `String.valueOf(n)` |
| **문자열 → 문자 리스트** | `list(s)` | `s.toCharArray()` (반환: `char[]`) |
| **리스트 → 문자열** | `"".join(list)` | `String.join("", list)` (Java 8+) |
| **문자 뒤집기** | `s[::-1]` | `new StringBuilder(s).reverse().toString()` |

## 문자열 덧샘

Java의 `String`은 불변(immutable)이다. 그래서 Python처럼 `s += 'a'`를 반복한다면 메모리 초과가 발생할 수도 있다.

따라서 문자열 변수에 변경이 많을 것으로 예상된다면 앞에 소개되었던 `StringBuilder`를 사용해 문자열 덧샘을 구현하는 것이 좋다.

```java
// 문자열 변경/추가
StringBuilder sb = new StringBuilder();
sb.append("abc");
sb.append("d");
String result = sb.toString();
```

# 자료구조

## Stack, Queue, Deque

## Dictionary(Map), Set

## 우선순위 큐

# 정렬

# 알고리즘

## DFS/BFS