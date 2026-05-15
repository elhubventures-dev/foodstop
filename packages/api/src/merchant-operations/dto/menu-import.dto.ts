import { IsString, MinLength } from 'class-validator';

/** JSON body: full CSV text (UTF-8). */
export class ImportMenuCsvDto {
  @IsString()
  @MinLength(1)
  csv!: string;
}
