enum DeckVisibility {
  PRIVATE
  LINK
  PUBLIC
}

enum SharePermission {
  VIEW
  EDIT
}

enum RoomStatus {
  WAITING
  PLAYING
  FINISHED
  CANCELLED
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  TYPING
  MATCHING
  FILL_IN_BLANK
}

enum CardDifficulty {
  EASY
  MEDIUM
  HARD
}

enum CardStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum CardSideType {
  FRONT
  BACK
  HINT
  EXPLANATION
}

enum MediaType {
  IMAGE
  AUDIO
  VIDEO
}

enum AuthProvider {
  EMAIL
  GOOGLE
  FACEBOOK
  GITHUB
  DISCORD
  APPLE
  OTHER
}

model User {
  /// Với Supabase Auth, id này nên trùng với auth.users.id.
  /// Không nên tự @default(uuid()) nếu user được tạo bởi Supabase Auth.
  id          String   @id @db.Uuid
  email       String   @unique
  displayName String?
  avatarUrl   String?

  /// Optional profile fields lấy từ OAuth metadata hoặc user tự cập nhật.
  username    String?  @unique
  bio         String?
  locale      String?
  timezone    String?

  /// Provider chính để app hiển thị/debug.
  /// Supabase vẫn quản lý provider thật trong auth.identities.
  primaryProvider AuthProvider @default(EMAIL)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  decks         Deck[]
  deckShares    DeckShare[]
  studyProgress StudyProgress[]
  roomsHosted   Room[]       @relation("RoomHost")
  roomPlayers   RoomPlayer[]
  roomAnswers   RoomAnswer[]

  @@map("users")
}

model Deck {
  id          String         @id @default(uuid()) @db.Uuid
  ownerId     String         @db.Uuid
  title       String
  description String?
  visibility  DeckVisibility @default(PRIVATE)
  shareCode   String?        @unique

  /// Thêm metadata cho deck
  language    String?
  tags        String[]       @default([])
  coverUrl    String?
  isArchived  Boolean        @default(false)

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  owner  User        @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  cards  Card[]
  shares DeckShare[]
  rooms  Room[]

  @@index([ownerId])
  @@index([visibility])
  @@index([shareCode])
  @@map("decks")
}

model Card {
  id        String   @id @default(uuid()) @db.Uuid
  deckId    String   @db.Uuid

  /// Card chi tiết hơn
  term          String?
  definition    String?
  pronunciation String?
  ipa           String?
  partOfSpeech  String?
  language      String?
  translation   String?
  transliteration String?

  /// Nội dung học tập
  example     String?
  note        String?
  hint        String?
  explanation String?
  mnemonic    String?

  /// Dữ liệu mở rộng: synonyms, antonyms, grammar, conjugation...
  metadata Json?

  /// Phân loại
  tags       String[]       @default([])
  difficulty CardDifficulty @default(MEDIUM)
  status     CardStatus     @default(PUBLISHED)

  /// Media chính, giữ để tương thích với schema cũ.
  imageUrl  String?
  audioUrl  String?

  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  deck          Deck            @relation(fields: [deckId], references: [id], onDelete: Cascade)
  studyProgress StudyProgress[]
  questions     RoomQuestion[]

  /// Bảng con cho nội dung chi tiết hơn
  sides      CardSide[]
  examples   CardExample[]
  media      CardMedia[]

  @@index([deckId])
  @@index([deckId, order])
  @@index([status])
  @@map("cards")
}

model CardSide {
  id        String       @id @default(uuid()) @db.Uuid
  cardId    String       @db.Uuid
  type      CardSideType
  content   String
  order     Int          @default(0)

  /// Ví dụ: "vi", "en", "ja"
  language  String?

  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  card Card @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@index([cardId])
  @@index([cardId, type])
  @@map("card_sides")
}

model CardExample {
  id          String   @id @default(uuid()) @db.Uuid
  cardId      String   @db.Uuid
  sentence    String
  translation String?
  note        String?
  source      String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  card Card @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@index([cardId])
  @@map("card_examples")
}

model CardMedia {
  id        String    @id @default(uuid()) @db.Uuid
  cardId    String    @db.Uuid
  type      MediaType
  url       String
  caption   String?
  order     Int       @default(0)
  createdAt DateTime  @default(now())

  card Card @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@index([cardId])
  @@map("card_media")
}

model DeckShare {
  id         String          @id @default(uuid()) @db.Uuid
  deckId     String          @db.Uuid
  userId     String          @db.Uuid
  permission SharePermission @default(VIEW)
  createdAt  DateTime        @default(now())

  deck Deck @relation(fields: [deckId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([deckId, userId])
  @@index([userId])
  @@map("deck_shares")
}

model StudyProgress {
  id             String    @id @default(uuid()) @db.Uuid
  userId         String    @db.Uuid
  cardId         String    @db.Uuid

  correctCount   Int       @default(0)
  wrongCount     Int       @default(0)

  /// Spaced repetition fields
  easeFactor     Float     @default(2.5)
  intervalDays   Int       @default(0)
  repetition     Int       @default(0)
  lapses         Int       @default(0)

  nextReviewAt   DateTime?
  lastReviewedAt DateTime?

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  card Card @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@unique([userId, cardId])
  @@index([userId, nextReviewAt])
  @@map("study_progress")
}

model Room {
  id          String     @id @default(uuid()) @db.Uuid
  hostId      String     @db.Uuid
  deckId      String     @db.Uuid
  code        String     @unique
  status      RoomStatus @default(WAITING)

  currentQuestionIndex Int @default(0)

  /// Game config
  maxPlayers        Int?
  questionTimeLimit Int  @default(15)
  allowLateJoin     Boolean @default(true)

  startedAt   DateTime?
  endedAt     DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  host      User           @relation("RoomHost", fields: [hostId], references: [id], onDelete: Cascade)
  deck      Deck           @relation(fields: [deckId], references: [id], onDelete: Cascade)
  players   RoomPlayer[]
  questions RoomQuestion[]
  answers   RoomAnswer[]

  @@index([hostId])
  @@index([deckId])
  @@index([code])
  @@map("rooms")
}

model RoomPlayer {
  id        String   @id @default(uuid()) @db.Uuid
  roomId    String   @db.Uuid
  userId    String   @db.Uuid
  nickname  String?
  score     Int      @default(0)
  joinedAt  DateTime @default(now())
  leftAt    DateTime?

  room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([roomId, userId])
  @@index([userId])
  @@map("room_players")
}

model RoomQuestion {
  id             String       @id @default(uuid()) @db.Uuid
  roomId         String       @db.Uuid
  cardId         String?      @db.Uuid
  index          Int
  type           QuestionType @default(MULTIPLE_CHOICE)

  prompt         String
  correctAnswer  String

  /// Multiple choice / matching / extra accepted answers
  options        Json?
  acceptedAnswers Json?

  explanation    String?
  timeLimitSec   Int          @default(15)
  points         Int          @default(100)

  createdAt      DateTime     @default(now())

  room    Room         @relation(fields: [roomId], references: [id], onDelete: Cascade)
  card    Card?        @relation(fields: [cardId], references: [id], onDelete: SetNull)
  answers RoomAnswer[]

  @@unique([roomId, index])
  @@index([roomId])
  @@index([cardId])
  @@map("room_questions")
}

model RoomAnswer {
  id          String   @id @default(uuid()) @db.Uuid
  roomId      String   @db.Uuid
  questionId  String   @db.Uuid
  userId      String   @db.Uuid
  answer      String
  isCorrect   Boolean
  responseMs  Int
  score       Int      @default(0)
  createdAt   DateTime @default(now())

  room     Room         @relation(fields: [roomId], references: [id], onDelete: Cascade)
  question RoomQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  user     User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([questionId, userId])
  @@index([roomId])
  @@index([userId])
  @@map("room_answers")
}