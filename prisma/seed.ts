import { PrismaClient, Role, Category } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.adminLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password', 10);

  // Create test users
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.create({
      data: {
        ssoId: `sso-test-user-${i}`,
        email: `test-user-${i}@test.com`,
        password: hashedPassword,
        role: Role.USER,
      },
    });
    users.push(user);
  }

  // Create admin
  const admin = await prisma.user.create({
    data: {
      ssoId: 'sso-test-admin-1',
      email: 'test-admin-1@test.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  // Create sample posts
  const categories = [Category.FREE, Category.QUESTION, Category.INFO];
  const postTitles = [
    '오늘 점심 뭐 먹을까요?',
    '새 프로젝트 킥오프 후기',
    '회의실 예약 시스템 개선 제안',
    '금요일 퇴근 후 번개 모임',
    '신규 입사자 환영합니다!',
    '개발팀 코드리뷰 가이드',
    '사내 동호회 모집합니다',
    '이번 분기 OKR 공유',
  ];

  const postContents = [
    '오늘 점심 메뉴 추천 받습니다. 한식? 양식? 일식?',
    '이번 주에 새 프로젝트 킥오프가 있었는데, 기대되는 프로젝트입니다.',
    '현재 회의실 예약이 불편한데, 개선 아이디어가 있으신 분?',
    '금요일 저녁에 간단한 번개 모임 하실 분 계신가요?',
    '이번 달에 새로 입사하신 분들 환영합니다! 궁금한 점은 편하게 물어보세요.',
    '코드리뷰 시 참고할 가이드라인을 정리했습니다.',
    '등산, 축구, 독서 등 동호회 회원 모집 중입니다.',
    '이번 분기 목표와 핵심 결과를 공유합니다.',
  ];

  const posts = [];
  for (let i = 0; i < postTitles.length; i++) {
    const post = await prisma.post.create({
      data: {
        authorId: users[i % users.length].id,
        title: postTitles[i],
        content: postContents[i],
        category: categories[i % categories.length],
        likeCount: Math.floor(Math.random() * 20),
        viewCount: Math.floor(Math.random() * 100),
      },
    });
    posts.push(post);
  }

  // Create sample comments
  const commentContents = [
    '좋은 의견이네요!',
    '저도 동의합니다.',
    '참고하겠습니다, 감사합니다.',
    '이건 좀 더 논의가 필요할 것 같아요.',
    '좋아요!',
  ];

  for (let i = 0; i < posts.length; i++) {
    const numComments = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numComments; j++) {
      await prisma.comment.create({
        data: {
          authorId: users[(i + j + 1) % users.length].id,
          postId: posts[i].id,
          content: commentContents[(i + j) % commentContents.length],
        },
      });
    }
    // Update comment count
    const count = await prisma.comment.count({
      where: { postId: posts[i].id },
    });
    await prisma.post.update({
      where: { id: posts[i].id },
      data: { commentCount: count },
    });
  }

  console.log('Seed completed successfully!');
  console.log(`Created ${users.length} users + 1 admin`);
  console.log(`Created ${posts.length} posts with comments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
