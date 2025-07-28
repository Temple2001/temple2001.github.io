---
title: Firebase와 Spring Security 인증 구현
description: Firebase auth와 Spring Security를 사용해서 회원 관리 및 인증을 구현하기
pubDate: 2024-09-02
tags: ['구현', '인증', 'Firebase', 'Spring Security']
---

# 목차

# 인증을 구현해보자
프로젝트에서 가입한 회원에 대한 인증/인가 작업을 구현해야 하는데, 인증 과정과 OAuth와 이메일-패스워드 로그인을 담당하는 작업은 **Firebase**를 통해 수행하고,
유저 데이터 저장이나 인가 과정은 **Spring Boot**와 **Spring Security**를 통해 수행하고자 한다.

> - 여기서 인증 인가란,
> **인증** : 사용자가 우리 회원이 맞는지 확인
> **인가** : 사용자가 우리 회원 중에서 어떤 권한을 가지고 있는 회원인지 확인

---

Firebase에서 비밀번호 같은 유저의 보안 관련 내용들을 저장하고 관리할 것이므로, 스프링으로 DB에 유저의 민감한 데이터들을 저장할 필요가 없어진다.
따라서 개발에서 보안에 대한 부담이 어느정도 줄어들 것이다. 그리고 Firebase에서 인증을 맡기 때문에 스프링 시큐리티의 구조가 꽤 단순해지는 효과도 있다.

인증 수단은 JWT 토큰을 사용할 것이다.

# 절차

## accessToken, refreshToken 발급
```java title="UserController.java"
@Operation(summary = "계정 생성", description = "idToken과 사용자 정보를 받고 계정을 생성합니다.")
@PostMapping("/user")
public ResponseEntity<TokenResponse> signUp(@Valid @RequestBody SignUpRequest signUpRequest) {
    String uid = userService.signUp(signUpRequest);
    TokenResponse tokenResponse = userService.generateTokenByUid(uid);
    return ResponseEntity.ok(tokenResponse);
}

@Operation(summary = "로그인", description = "idToken을 받고 해당되는 계정이 있다면 accessToken과 refreshToken을 반환합니다.")
@PostMapping("/login")
public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
    String uid = userService.login(loginRequest);
    TokenResponse tokenResponse = userService.generateTokenByUid(uid);
    return ResponseEntity.ok(tokenResponse);
}
```

```java title="UserService.java"
public String signUp(SignUpRequest request) throws CustomException {
    // 토큰 검증
    FirebaseToken decodedToken;
    try {
        decodedToken = firebaseAuth.verifyIdToken(request.getIdToken());
    } catch (FirebaseAuthException e) {
        throw new CustomException(ErrorCode.IDTOKEN_NOT_VERIFIED);
    }

    ...

}

public String login(LoginRequest request) throws CustomException {
    // 토큰 검증
    FirebaseToken decodedToken;
    try {
        decodedToken = firebaseAuth.verifyIdToken(request.getIdToken());
    } catch (FirebaseAuthException e) {
        throw new CustomException(ErrorCode.IDTOKEN_NOT_VERIFIED);
    }

    ...

}

public TokenResponse generateTokenByUid(String uid) throws CustomException {
    UserDetails userDetails;
    try {
        userDetails = userDetailsService.loadUserByUsername(uid);
    } catch (UsernameNotFoundException e) {
        throw new CustomException(ErrorCode.USER_NOTFOUND_IN_DB);
    }

    Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
    return jwtTokenProvider.generateToken(authentication);
}
```
먼저 유저가 계정을 생성하거나 로그인 할 때 사용하는 API를 구현하고 클라이언트에서 보낸 **idToken**을 받아 검증을 수행하는 로직을 넣는다. 이때의 idToken은 firebase의 Authentication 서비스에서 다루는 인증 토큰으로, 클라이언트가 유저에게 firebase를 통한 로그인을 수행한 후 해당 로그인으로 얻어진 idToken 값을 서버에 보내주는 과정에 의해 받을 수 있게 된다.

[자세한 내용은 공식 문서 참조](https://firebase.google.com/docs/auth/admin/verify-id-tokens?hl=ko)

그리고 `generateTokenByUid` 메서드로 유저를 구별할 수 있는 고유한 데이터(여기서는 firebase에서 제공하는 uid를 사용)를 `UsernamePasswordAuthenticationToken` 에 넣어 Authentication을 생성하고 이것을 활용해 클라이언트에게 보내줄 accessToken 및 refreshToken을 생성하게 된다.

```java title="JwtTokenProvider.java"
...

public TokenResponse generateToken(Authentication authentication) {
    String authorities = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.joining(","));

    Claims claims = Jwts.claims()
            .subject(authentication.getName())
            .add("auth", authorities)
            .build();

    long now = (new Date()).getTime();

    Date accessTokenExpiration = new Date(now + accessExpiration);
    String accessToken = Jwts.builder()
            .claims(claims)
            .expiration(accessTokenExpiration)
            .signWith(key)
            .compact();

    Date refreshTokenExpiration = new Date(now + refreshExpiration);
    String refreshToken = Jwts.builder()
            .claims(claims)
            .expiration(refreshTokenExpiration)
            .signWith(key)
            .compact();

    return TokenResponse.builder()
            .grantType("Bearer")
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .build();
}

...
```

토큰 생성은 Jwts 라이브러리를 이용해 생성한다. 
토큰의 subject에는 firebase의 **UID**를 넣어 어떤 유저인지 구별할 수 있도록 하였고, 토큰의 auth에는 유저의 권한 정보를 넣어 이 유저가 어떤 권한을 갖고 있는지 알 수 있도록 하였다.

## SecurityConfig

```java {17} title="SecurityConfig.java"
@Configuration
@EnableWebSecurity
@AllArgsConstructor
public class SecurityConfig {
    private final JwtTokenFilter jwtTokenFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                    .anyRequest().permitAll())
            .headers(headers -> headers
                    .frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    ...

}
```

클라이언트가 서버에서 발급한 accessToken을 이용해 스프링으로 요청을 보낼 때 진입점이 되는 SecurityConfig라는 Configuration 클래스를 작성해준다.
`@Configuration`과 `@EnableWebSecurity` 어노테이션을 붙여 클래스를 작성하고, 여기에 CORS 설정, CSRF 설정, URL 접근 권한 설정, 그리고 Filter 설정 외의 다양한 Spring Security 설정들을 할 수 있는 `filterChain`이라는 Bean을 생성한다.

여기서 유심히 볼 부분은 `addFilterBefore` 메서드로 클라이언트에게 accessToken 또는 refreshToken을 받아 인증을 수행하는 `JwtTokenFilter` 필터를 `UsernamePasswordAuthenticationFilter` 전에 넣어주는 부분이 되겠다.

## JwtTokenFilter

```java {14} title="JwtTokenFilter.java"
@Component
@AllArgsConstructor
public class JwtTokenFilter extends OncePerRequestFilter {
    private JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String accessToken = getTokenFromRequest(request, "Authorization");

        if (accessToken != null) {
            try {
                if (jwtTokenProvider.validateToken(accessToken)) {
                    Authentication auth = jwtTokenProvider.getAuthentication(accessToken);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    sendErrorResponse(response, HttpServletResponse.SC_FORBIDDEN, "Access Token이 만료되었습니다.");
                    return;
                }
            } catch (UsernameNotFoundException e) {
                sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "토큰에 해당하는 유저가 존재하지 않습니다. " + e);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request, String headerName) {
        String header = request.getHeader(headerName);
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    private void sendErrorResponse(HttpServletResponse response, int errorCode, String message) throws IOException {
        response.setStatus(errorCode);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
```

```java title="JwtTokenProvider.java"
...

public Authentication getAuthentication(String accessToken) throws UsernameNotFoundException {
    Claims claims = parseClaims(accessToken);

    Collection<? extends GrantedAuthority> authorities =
            Arrays.stream(claims.get("auth").toString().split(","))
                    .map(SimpleGrantedAuthority::new)
                    .toList();

    UserDetails principal = userDetailsService.loadUserByUsername(claims.getSubject());
    return new UsernamePasswordAuthenticationToken(principal, "", authorities);
}

public boolean validateToken(String token) {
    try {
        Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        return true;
    } catch (JwtException e) {
        return false;
    }

}

private Claims parseClaims(String accessToken) throws ExpiredJwtException {
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(accessToken).getPayload();
}

...
```

jwt 필터를 담당하는 클래스는 `OncePerRequestFilter`를 상속하며, 이는 jwt 필터가 요청당 한번만 실행되도록 하기 위함이다. 그리고 `doFilterInternal` 메서드에 토큰을 검증하는 로직을 구성한다. 

검증을 통과하면 토큰에 있는 firebase UID를 가져와 UID로 데이터베이스에서 유저를 조회해 `UserDetails`에 넣어 **principal**을 만들고, 토큰에 있는 권한 정보를 가져와 **authorities**를 만든다.
그리고 그것들을 `UsernamePasswordAuthenticationToken` 클래스 생성자에 넣어 최종적으로 **Authentication** 객체를 만들어낸다.

그리고 `SecurityContextHolder.getContext().setAuthentication(auth)`를 통해 방금 생성한 Authentication 객체를 현재 유저의 인증 정보로 설정한다. 이를 통해 요청을 보낸 유저가 어떤 권한을 가지고 있는지 파악할 수 있는 **인가** 과정을 수행할 수 있게 된다.

## 로그인한 유저 정보 사용하기
`setAuthentication`으로 `SecurityContextHolder`에 유저 정보를 담았다면, Controller 같은 곳에서 손쉽게 사용할 수 있다.

```java title="UserController.java" /@AuthenticationPrincipal/
@Operation(summary = "계정 삭제", description = "로그인한 사용자의 계정을 삭제합니다. 로그인된 사용자만 사용 가능합니다.")
@PreAuthorize("isAuthenticated()")
@DeleteMapping("/user/me")
public ResponseEntity<Void> deleteMyUserInfo(@AuthenticationPrincipal CustomUserDetails userDetails) {
    userService.deleteMyUserInfo(userDetails);
    return ResponseEntity.ok().build();
}
```

```java title="UserService.java" {2}
public void deleteMyUserInfo(CustomUserDetails userDetails) {
    User user = userDetails.getUser();

    userRepository.delete(user);
}
```

예를 들어 유저를 삭제하는 API를 구현해야 할 때, 파라미터에 `@AuthenticationPrincipal` 어노테이션을 붙인다면 스프링이 자동으로 `SecurityContextHolder`에서 Authentication을 가져온 후 그 중에 principal만을 해당 파라미터에 넣어준다.
따라서 지금까지 구현한 대로라면 유저의 정보를 담은 `UserDetails` 객체가 파라미터에 주입되는 것이다.

그리고 `UserDetails` 객체로부터 스프링에서 실질적으로 사용되는 `User` 객체를 얻기 위해 해당 파라미터의 타입을 `UserDetails` 객체로 `User` 객체를 얻을 수 있는 `getUser` 메서드가 구현된 `CustomUserDetails`로 만들어주었고, 결국 `getUser` 메서드를 통해 `User` 객체를 불러올 수 있게 된다.