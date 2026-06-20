import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isOriginal?: boolean;
}

export class UpdateCategoryOrderDto {
  @IsInt()
  @Min(0)
  order: number;
}
