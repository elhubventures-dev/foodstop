import { IsString, MaxLength, MinLength } from 'class-validator';

export class ReplyMerchantReviewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reply_text!: string;
}
