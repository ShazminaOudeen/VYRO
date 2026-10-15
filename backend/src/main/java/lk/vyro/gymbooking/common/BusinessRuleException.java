package lk.vyro.gymbooking.common;

public class BusinessRuleException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessRuleException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public BusinessRuleException(String message) {
        this(ErrorCode.UNEXPECTED_ERROR, message);
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
