---
title: SpringBoot Hibernate에서 @SoftDelete 사용하기
description: 귀찮은 soft delete 작업을 어노테이션 한번으로 끝내보자
pubDate: 2024-09-08
tags: ['tmp']
---

# 목차

# Soft Delete를 구현해보자
외국인 유학생 커뮤니티 프로젝트에 참여할 때, 개발 초기에는 게시글이나 유저 데이터 등 데이터들을 삭제하라는 요청이 들어오면 바로 DB에서 삭제하는 방식으로 구현했었다. 당시에는 그 방식이 별도의 코드 없이도 JPA의 delete 메서드로 뚝딱 처리되었으니 어떤 고민 없이 넘어갔었는데, PM에게 soft delete를 적용해 달라는 요청을 받았다. 커뮤니티 운영 상 사용자의 요청에 따라 삭제를 수행해도 일정 기간동안 보관하는 로직이 필요하다는 것이다.

들어보니 일리가 있는 요청이라고 생각했고, 생각없이 코드를 짰던 예전의 나에게 원망섞인 외침을 한번 날려주며 soft-delete를 적용할 수 있도록 코드를 개선하기 시작했다.

처음에 생각했던 방식은 **delete flag**를 soft delete가 적용되는 각 테이블에 하나씩 달아주는 것이다. boolean 형식의 delete flag는 false면 삭제되지 않은 데이터를, true면 삭제된 데이터를 표현하게 된다. 생성된 데이터는 기본적으로 delete flag가 false이지만 삭제 요청이 들어오면 delete flag를 true로 변경되며, DB에서 바로 삭제되는 것이 아니라 delete flag 필드만 변경된 상태가 되는 것이다.

```java {15,16}
@Getter
@Setter
@Embeddable
public class DeleteFlag {
    @Column(columnDefinition = "boolean default false")
    private boolean deleteFlag = false;
}

@Entity
@Entity
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CommunityComment extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    ...

    @Embedded
    private DeleteFlag deleteFlag = new DeleteFlag();
}
```

`@Embedded`와 `@Embeddable` 어노테이션으로 `DeleteFlag`를 분리하여 delete flag의 정의 및 기본값 설정을 한 곳에서 관리할 수 있도록 만들었다.

---

그러나 이 방법을 사용하게 되면 기존의 삭제 요청 때 사용했던 JPA의 delete 메서드를 쓰지 못한다. delete 메서드는 실제로 DB에 요청을 보내 데이터를 삭제하게 만들기 때문이다. 따라서 delete 메서드를 사용하는 대신 delete flag를 수정하고 save 메서드를 사용하여 마치 수정 요청이 들어온 것처럼 구현해야 한다.

```java title="기존 코드" {9}
public void deleteComment(CustomUserDetails userDetails, Long commentId) throws CustomException {
    User user = userDetails.getUser();
    CommunityComment comment = commentRepository.findById(commentId).orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOTFOUND_IN_DB));

    if (isNotWriter(comment.getWriter(), user)) {
        throw new CustomException(ErrorCode.USER_NOT_WRITER);
    }

    commentRepository.delete(comment);
}
```

```java title="delete flag 적용" {9,10}
public void deleteComment(CustomUserDetails userDetails, Long commentId) throws CustomException {
    User user = Utils.checkUserExisted(userDetails);
    CommunityComment comment = checkCommunityCommentExisted(commentId);

    if (isNotWriter(comment.getWriter(), user)) {
        throw new CustomException(ErrorCode.USER_NOT_WRITER);
    }

    comment.getDeleteFlag().setDeleteFlag(true);
    commentRepository.save(comment);
}
```

그리고 DB에서 삭제하는 대신 delete flag로 삭제를 표현하기 때문에 delete flag가 true인 데이터는 읽기 요청에서 읽지 못하도록 만들어야 한다. 이는 Repository 코드에서 `@Query`를 통해 직접 설정해주었다.

```java {2,5}
public interface CommunityCommentRepository extends JpaRepository<CommunityComment, Long> {
    @Query("SELECT c FROM CommunityComment c WHERE c.post = :post AND c.deleteFlag.deleteFlag = false")
    Page<CommunityComment> findAllByPost(CommunityPost post, Pageable pageable);

    @Query("SELECT c FROM CommunityComment c WHERE c.writer = :user AND c.deleteFlag.deleteFlag = false")
    Page<CommunityComment> findByWriter(User user, Pageable pageable);

    ...
}
```
---

어찌저찌 soft delete는 구현했는데, 만들고 나니 개발 과정이 정말 더러워져버렸다.
테이블이 하나 추가될 때마다 delete flag 필드를 직접 추가해야 하고, delete flag가 사용되는 Repository 코드는 직접 쿼리를 작성해주어야 하기 때문에 메서드 이름만으로 Query를 만들 수 있었던 **메서드 쿼리** 방식을 전혀 사용하지 못하게 되었다.
가장 막막한 상황은 Repository 코드의 쿼리를 앞으로 직접 만들어야 한다는 것이다. 여간 귀찮은 작업이 아닐 수가 없다.

그렇게 고민에 빠져있던 도중 기능 하나를 발견하게 되었다.

# Hibernate의 새로운 기능 - @SoftDelete
바로 Hibernate 6.4버전 부터 사용가능한 신기능인 `@SoftDelete` 어노테이션이다.

이 어노테이션의 기능은 간단하면서도 강력하다. 엔티티의 클래스에 해당 어노테이션을 붙여주면 자동으로 해당 테이블의 delete flag 필드(기본값 이름은 `deleted`)를 만들어주고, 삭제 요청이 발생하면 해당 `deleted` 필드를 변경해주며 조회 요청이 발생해도 자동으로 `deleted` 필드의 값에 따라 삭제된 데이터를 제외시켜 준다!

```java {7}
@Entity
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@SoftDelete(columnName = "delete_flag")
public class CommunityComment extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    ...
}
```

따라서 soft-delete를 적용하지 않았던 코드와 비슷하게 JPA의 delete 메서드를 그대로 사용해도 되며, Repository 코드에서 쿼리를 일일이 작성하지 않아도 되었다.
단순히 개발 과정이 깨끗해진 것 뿐만 아니라 번거로운 코드를 작성하며 발생할 수 있는 실수들도 원천 방지할 수 있기 때문에 정말 좋은 기능이라고 생각한다.