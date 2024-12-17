export interface IConfiguration {
    country:                  string;
    currency:                 string;
    phone_number_placeholder: string;
    bank_type_label:          string;
    bank_account_label:       string;
    payment_methods:          Array<string[]>;
    bank_types:               Array<Array<number | string>>;
}
