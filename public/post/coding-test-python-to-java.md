---
title: 코딩테스트를 위한 Python to Java 전환기
description: 코딩테스트를 위해 익숙했던 Python에서 Java로 넘어가기 위한 준비
pubDate: 2025-09-02
tags: [리서치, 코딩테스트, Python, Java]
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

```java
// 문자열 변경/추가
StringBuilder sb = new StringBuilder();
sb.append("abc");
sb.append("d");
String result = sb.toString();
```

Java의 `String`은 불변(immutable)이다. 그래서 Python처럼 `s += 'a'`를 반복한다면 메모리 초과가 발생할 수도 있다.

따라서 문자열 변수에 변경이 많을 것으로 예상된다면 앞에 소개되었던 `StringBuilder`를 사용해 문자열 덧샘을 구현하는 것이 좋다.

# 자료구조

## Stack, Queue, Deque

```java
Deque<Integer> dq = new ArrayDeque<>();

// Stack 처럼 쓰기
dq.push(1); 
dq.pop();

// Queue 처럼 쓰기
dq.offer(1); // python append
dq.poll();   // python popleft
dq.peek();   // 맨 앞 확인
```

보통 파이썬에서 Stack은 `list`로, Queue와 Deque는 `collections.deque`로 사용한다. 그리고 Stack은 편의상 보통 `list`를 사용하지만 `collections.deque`로도 사용 가능하다.

Java는 이 세가지 자료구조를 모두 `ArrayDeque` 하나로 해결할 수 있다. 특히 Java에는 Stack 자료구조를 위한 `Stack` 클래스가 있는데, 코딩테스트 환경에서는 가급적 사용하면 안된다.

그 이유는 [이 블로그](https://vanslog.io/posts/language/java/why-use-deque-instead-of-stack/)에 아주 잘 설명되어 있는데, 간단히 말하자면 Java의 `Stack` 클래스가 상속 및 사용하는 `Vector` 클래스가 동기화 처리와 thread-safe를 위해 성능을 어느정도 포기하기 때문이다.

코딩테스트에서는 멀티 스레드 환경을 구성할 일이 거의 없기에 `Stack`보다 `ArrayDeque`를 사용하여 성능도 챙기고 구현의 간결함도 챙기는 것이 좋다.

## Dictionary(Map), Set

```java
// HashMap (Dictionary)
HashMap<String, Integer> map = new HashMap<>();
map.put("key", 1);
map.put("key", map.getOrDefault("key", 0) + 1);     // dict.get(key, 0)과 동일
if (map.containsKey("key")) { ... }     // Key 존재 확인

// HashSet (Set)
HashSet<Integer> set = new HashSet<>();
set.add(1);
if (set.contains(1)) { ... }
```

Python의 Dictionary와 Set은 Java의 `HashMap`, `HashSet`과 각각 대응된다.
이때 제네릭을 사용해 `HashMap`의 key, value와 `HashSet`의 값이 어떤 타입인지 명시해주어야 한다.

## 우선순위 큐

```java
// 최소 힙 (기본)
PriorityQueue<Integer> pq = new PriorityQueue<>();

// 최대 힙
PriorityQueue<Integer> maxPq = new PriorityQueue<>(Collections.reverseOrder());

pq.offer(10);
pq.poll(); // 최소값 추출
```

Python에서는 `heapq`를 사용해 우선순위 큐를 사용한다. Java에서는 `PriorityQueue`를 사용한다.

Python과 마찬가지로 우선순위 큐는 기본적으로 최소 힙(Min Heap)이고, `Collections.reverseOrder()`를 사용해 최대 힙으로 변경할 수 있다.

# 정렬

Java는 자료구조에 따라 정렬을 수행하는 클래스가 다르다. 

대상|사용하는 클래스|메서드|시간복잡도|
|---|---|---|---|
|배열 (int[], String[])|java.util.Arrays|Arrays.sort(arr)|O(N log N)|
|리스트 (ArrayList, LinkedList)|java.util.Collections|Collections.sort(list)|O(N log N)|

## 오름차순 정렬 (기본)

```java
// 1. 배열 정렬
int[] arr = {3, 1, 2};
Arrays.sort(arr); // {1, 2, 3}

// 2. 리스트 정렬
ArrayList<Integer> list = new ArrayList<>(Arrays.asList(3, 1, 2));
Collections.sort(list); // [1, 2, 3]
// 또는
list.sort(null); // Java 8+
```

`sort()`를 호출하여 정렬한다.

## 내림차순 정렬

```java
int[] arr = {1, 2, 3};
Arrays.sort(arr, Collections.reverseOrder()); // 컴파일 에러! int는 객체가 아님

// 올바른 예
Integer[] arr = {1, 2, 3}; // int[]가 아니라 Integer[]
Arrays.sort(arr, Collections.reverseOrder()); // {3, 2, 1}

// 리스트(ArrayList)는 이미 객체이므로 바로 가능
Collections.sort(list, Collections.reverseOrder());
```

Python에서 파라미터에 `reverse=True`만 붙여줘도 내림차순 정렬이 적용되듯이, Java도 `Arrays.sort(arr, Collections.reverseOrder());` 형식으로 내림차순 정렬을 설정할 수 있다.

그러나 이때 주의해야 할 점이 있는데, Primitive Type(int, char, double 등) 배열에는 이것이 불가능하다. Primitive Type은 객체가 아니기 때문이다.

따라서 Primitive Type 배열에서는 각 요소를 적절한 Wrapper 클래스로 변환하고(ex. `int[]` -> `Integer[]`) `Collections.reverseOrder()`를 사용해야 한다.

## 사용자 정의 정렬

Python에서는 `key=lambda x: (x[0], -x[1])` 처럼 파라미터를 추가하여 정렬 조건을 마음대로 정할 수 있다.
Java에서도 비슷하게 `Comparator` 인터페이스를 람다식으로 구현하고 `sort()` 파라미터에 추가하여 정렬 조건을 정할 수 있다.

람다식은 `Arrays.sort(arr, (o1, o2) -> { ... })` 형식을 가진다. 람다식의 반환값(return)에 따라 두 요소의 순서가 결정된다.
- 음수 return : o1이 o2보다 앞에 옴
- 양수 return : o1이 o2보다 뒤에 옴
- 0 return : 같음

따라서 오름차순을 위해서는 반환값이 `o1 - o2`여야 하고, 내림차순을 위해서는 반환값이 `o2 - o1`여야 한다.

그리고 람다식이기에 이중 조건을 구현할 수도 있다.
아래 코드는 Python의 `arr.sort(key=lambda x: (x[0], -x[1]))`와 같은 역할을 한다.

```java
int[][] arr = {{1, 3}, {1, 2}, {2, 5}};

Arrays.sort(arr, (o1, o2) -> {

    if (o1[0] == o2[0]) {
        // 첫 번째 값이 같다면 두 번째 값 비교 (내림차순: o2 - o1)
        return o2[1] - o1[1]; 
    } else {
        // 첫 번째 값이 다르면 첫 번째 값 비교 (오름차순: o1 - o2)
        return o1[0] - o2[0];
    }
});
// 결과: [[1, 3], [1, 2], [2, 5]]
```

# 알고리즘

## DFS/BFS

```java
// 그래프 초기화 (인접 리스트)
List<List<Integer>> graph = new ArrayList<>();
for (int i = 0; i <= N; i++) graph.add(new ArrayList<>());
boolean[] visited = new boolean[N + 1];

// 1. DFS (재귀)
void dfs(int node) {
    visited[node] = true;
    for (int next : graph.get(node)) {
        if (!visited[next]) dfs(next);
    }
}

// 2. BFS (큐)
void bfs(int start) {
    Queue<Integer> q = new ArrayDeque<>();
    q.offer(start);
    visited[start] = true;
    
    while (!q.isEmpty()) {
        int cur = q.poll();
        for (int next : graph.get(cur)) {
            if (!visited[next]) {
                visited[next] = true;
                q.offer(next);
            }
        }
    }
}
```

## 다익스트라 (Dijkstra)

```java
class Node implements Comparable<Node> {
    int idx, cost;
    public Node(int idx, int cost) { this.idx = idx; this.cost = cost; }
    
    // 우선순위 큐 정렬 기준 (비용 오름차순)
    @Override
    public int compareTo(Node o) {
        return this.cost - o.cost;
    }
}

// 다익스트라
void dijkstra(int start) {
    PriorityQueue<Node> pq = new PriorityQueue<>();
    pq.offer(new Node(start, 0));
    dist[start] = 0; // dist 배열은 미리 아주 큰 값으로 초기화 필수
    
    while (!pq.isEmpty()) {
        Node cur = pq.poll();
        
        if (dist[cur.idx] < cur.cost) continue;
        
        for (Node next : graph.get(cur.idx)) { // graph는 List<List<Node>>
            if (dist[next.idx] > cur.cost + next.cost) {
                dist[next.idx] = cur.cost + next.cost;
                pq.offer(new Node(next.idx, dist[next.idx]));
            }
        }
    }
}
```

## Union-find

```java
int[] parent = new int[N + 1];
for (int i = 1; i <= N; i++) parent[i] = i;

int find(int x) {
    if (parent[x] == x) return x;
    return parent[x] = find(parent[x]); // 경로 압축
}

void union(int a, int b) {
    int rootA = find(a);
    int rootB = find(b);
    if (rootA != rootB) parent[rootB] = rootA;
}
```