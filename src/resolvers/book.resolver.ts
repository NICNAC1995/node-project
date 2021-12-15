import {
  Mutation,
  Resolver,
  Arg,
  InputType,
  Field,
  Query,
  UseMiddleware,
  Ctx,
} from "type-graphql";
import { getRepository, RemoveOptions, Repository } from "typeorm";
import { Author } from "../entity/author.entity";
import { Book } from "../entity/book.entity";
import { Length } from "class-validator";
import { IContext, isAuth } from "../middlewares/auth.middleware";
import { User } from "../entity/user.entity";

@InputType()
class BookInput {
  @Field()
  @Length(3, 64)
  title!: string;

  @Field()
  author!: number;
}

@InputType()
class BookUpdateInput {
  @Field(() => String, { nullable: true })
  @Length(3, 64)
  title?: string;

  @Field(() => Number, { nullable: true })
  author?: number;
}

@InputType()
class BookUpdateParsedInput {
  @Field(() => String, { nullable: true })
  @Length(3, 64)
  title?: string;

  @Field(() => Author, { nullable: true })
  author?: Author;
}

@InputType()
class BookIdInput {
  @Field(() => Number)
  id!: number;
}

// @InputType()
// class GetBookOnLoanInput {
//   @Field(() => Number)
//   id!: number;
// }

// @InputType()
// class GetBookOnLoanInput {
//   @Field(() => Number)
//   id!: number;

//   @Field(() => String)
//   title!: string;

//   @Field(() => Boolean)
//   isOnLoan!: boolean;
// }

@Resolver()
export class BookResolver {
  bookRepository: Repository<Book>;
  authorRepository: Repository<Author>;
  userRepository: Repository<User>;

  constructor() {
    this.bookRepository = getRepository(Book);
    this.authorRepository = getRepository(Author);
    this.userRepository = getRepository(User);
  }

  @Mutation(() => Book)
  @UseMiddleware(isAuth)
  async createBook(
    @Arg("input", () => BookInput) input: BookInput,
    @Ctx() context: IContext
  ) {
    try {
      const author: Author | undefined = await this.authorRepository.findOne(
        input.author
      );
      if (!author) {
        const error = new Error();
        error.message =
          "The autor for this book does not exist, please double check";
        throw error;
      }

      const book = await this.bookRepository.insert({
        title: input.title,
        author: author,
      });

      return await this.bookRepository.findOne(book.identifiers[0].id, {
        relations: ["author", "author.books"],
      });
    } catch (e) {
      throw new Error(e.message);
    }
  }

  @Query(() => [Book])
  @UseMiddleware(isAuth)
  async getAllBooks(): Promise<Book[]> {
    try {
      return await this.bookRepository.find({
        relations: ["author", "author.books"],
      });
    } catch (e) {
      throw new Error(e);
    }
  }

  @Query(() => Book)
  @UseMiddleware(isAuth)
  async getBookById(
    @Arg("input", () => BookIdInput) input: BookIdInput,
    @Ctx() context: IContext
  ): Promise<Book | undefined> {
    try {
      const book = await this.bookRepository.findOne(input.id, {
        relations: ["author", "author.books"],
      });
      if (!book) {
        const error = new Error();
        error.message = "Book not found";
        throw error;
      }
      return book;
    } catch (e) {
      throw new Error(e);
    }
  }

  @Mutation(() => Boolean)
  async updateBookById(
    @Arg("bookId", () => BookIdInput) bookId: BookIdInput,
    @Arg("input", () => BookUpdateInput) input: BookUpdateInput
  ): Promise<Boolean> {
    try {
      await this.bookRepository.update(bookId.id, await this.parseInput(input));
      return true;
    } catch (e) {
      throw new Error();
    }
  }

  @Mutation(() => Boolean)
  async deleteBook(
    @Arg("bookId", () => BookIdInput) bookId: BookIdInput
  ): Promise<Boolean> {
    try {
      const result = await this.bookRepository.delete(bookId.id);
      if (result.affected === 0) throw new Error("Book does not exist");
      return true;
    } catch (e) {
      throw new Error(e);
    }
  }

  private async parseInput(input: BookUpdateInput) {
    try {
      const _input: BookUpdateParsedInput = {};
      if (input.title) {
        _input["title"] = input.title;
      }
      if (input.author) {
        const author = await this.authorRepository.findOne(input.author);
        if (!author) {
          throw new Error("This author does not exist");
        }
        _input["author"] = await this.authorRepository.findOne(input.author);
      }

      return _input;
    } catch (e) {
      throw new Error();
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async getBookOnLoan(
    @Arg("bookId", () => BookIdInput) bookId: BookIdInput,
    @Ctx() context: IContext
  ): Promise<Boolean | undefined> {
    try {
      const conectedUserPayload = context.payload;
      const conectedUserPayloadValues = Object.values(conectedUserPayload);
      const conectedUserId = conectedUserPayloadValues[0];
      const conectedUserIdParsed = Number(conectedUserId);
      console.log(conectedUserId);
      const bookToLoan: any = await this.bookRepository.findOne(bookId.id);
      if (!bookToLoan) throw new Error("Book does not exist");
      if (bookToLoan.isOnloan === true)
        throw new Error("Book is already on loan");
      const findQuantityLimitOfBorrowedBooks =
        await this.userRepository.findOne(conectedUserId);
      const quantityLimitOfBorrowedBooks =
        findQuantityLimitOfBorrowedBooks?.booksOnLoanQuantity;
      console.log(quantityLimitOfBorrowedBooks);
      const quantityLimitOfBorrowedBooksParsed = Number(
        quantityLimitOfBorrowedBooks
      );
      const quantityLimitOfBorrowedBooksExceeded =
        quantityLimitOfBorrowedBooksParsed >= 3;
      if (quantityLimitOfBorrowedBooksExceeded)
        throw new Error(
          "You cannot borrow another book, as you have already exceeded the limit of books on loan at the same time (3)"
        );
      await this.bookRepository.update(bookId.id, { isOnloan: true });
      await this.userRepository.update(conectedUserId, {
        booksOnLoanQuantity: quantityLimitOfBorrowedBooksParsed + 1,
      });
      await this.bookRepository.update(bookId.id, {
        userId: conectedUserIdParsed,
      });
      return true;
    } catch (e) {
      throw new Error(e);
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async returnBookOnLoan(
    @Arg("input", () => BookIdInput) BookId: BookIdInput,
    @Ctx() context: IContext
  ): Promise<Boolean> {
    try {
      const conectedUserPayloadReturn = context.payload;
      const conectedUserPayloadValuesToReturn = Object.values(
        conectedUserPayloadReturn
      );
      const conectedUserIdToReturn = conectedUserPayloadValuesToReturn[0];
      const conectedUserIdToReturnParsed = Number(conectedUserIdToReturn);

      const bookToReturn = await this.bookRepository.findOne(BookId.id);
      if (!bookToReturn) throw new Error("Book does not exist");
      const bookIsAlreadyOnLoan = bookToReturn.isOnloan !== true;
      if (bookIsAlreadyOnLoan) throw new Error("Book is not loaned");
      const bookToReturnDataUser = bookToReturn.userId;
      const bookToReturnDataUserParsed = Number(bookToReturnDataUser);
      const isTheSameUser =
        conectedUserIdToReturnParsed === bookToReturnDataUserParsed;
      if (!isTheSameUser)
        throw new Error("You cannot return this book, as you didn't borrow it");
      const userData = await this.userRepository.findOne(
        conectedUserIdToReturn
      );
      const quantityOfLoeanedBooks = userData?.booksOnLoanQuantity;
      const quantityOfLoeanedBooksParsed = Number(quantityOfLoeanedBooks);

      await this.bookRepository.update(BookId.id, { isOnloan: false });
      await this.userRepository.update(conectedUserIdToReturn, {
        booksOnLoanQuantity: quantityOfLoeanedBooksParsed - 1,
      });
      return true;
    } catch (e) {
      throw new Error(e);
    }
  }

  @Query(() => [Book])
  @UseMiddleware(isAuth)
  async getBookForUsers(): Promise<Book[]> {
    try {
      const bookUsers = await this.bookRepository.find({
        relations: ["author", "author.books"],
      });
      const filteredBooksUsers = bookUsers.filter(
        (item) => item.isOnloan !== true
      );
      return filteredBooksUsers;
    } catch (e) {
      throw new Error(e);
    }
  }

  @Query(() => [Book])
  async getBooksOnLoanReport(): Promise<Book[]> {
    try {
      const allBooks = await this.bookRepository.find({
        relations: ["author", "author.books"],
      });
      const filteredLoanedBooks = allBooks.filter(
        (item) => item.isOnloan === true
      );
      return filteredLoanedBooks;
    } catch (e) {
      throw new Error(e);
    }
  }

  // @Mutation(() => Book)
  // async getBookOnLoan(
  //   @Arg("bookLoanId", () => GetBookOnLoanInput) bookLoanId: GetBookOnLoanInput
  // ): Promise<Book | undefined | Boolean> {
  //   const bookExists = await this.bookRepository.findOne(bookLoanId.id);

  //   if (!bookExists) {
  //     throw new Error("Book does not exist");
  //   }

  //   const successfulLoeanedBook = await this.bookRepository.save({
  //     id: bookLoanId.id,
  //     title: bookLoanId.title,
  //     isOnLoan: bookLoanId.isOnLoan,
  //   });
  //   return await this.bookRepository.findOne(successfulLoeanedBook.id);
  // }

  // @Mutation(() => Book)
  // async getBookOnLoan(
  //   @Arg("bookLoanId", () => GetBookOnLoanInput) bookLoanId: GetBookOnLoanInput
  // ): Promise<Book | null> {
  //   const bookExists = await this.bookRepository.findOne(bookLoanId.id);

  //   if (!bookExists) {
  //     throw new Error("Book does not exist");
  //   }

  //   const loanedBook = await this.bookRepository.remove(bookExists);
  //   return loanedBook;
  //   // return await this.bookRepository.findOne(loanedBook.id);
  // }
}
