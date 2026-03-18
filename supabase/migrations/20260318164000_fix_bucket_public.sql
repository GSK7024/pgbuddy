-- Force the payment-proofs bucket to be public so getPublicUrl() works
UPDATE storage.buckets SET public = true WHERE id = 'payment-proofs';
