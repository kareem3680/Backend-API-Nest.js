import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

type Metatype = new (...args: unknown[]) => unknown;

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  async transform(value: unknown, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype as Metatype, value);
    const errors = await validate(object as object);

    if (errors.length > 0) {
      const messages = errors.map((error) =>
        Object.values(error.constraints || {}).join(', '),
      );
      throw new BadRequestException(messages.join('; '));
    }

    return object;
  }

  private toValidate(metatype: Metatype): boolean {
    const types: Metatype[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
