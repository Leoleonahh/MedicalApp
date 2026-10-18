import 'package:flutter/material.dart';

import 'theme.dart';

class PageLoading extends StatelessWidget {
  const PageLoading({super.key, this.label = 'กำลังโหลดข้อมูล...'});
  final String label;

  @override
  Widget build(BuildContext context) => Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 14),
          Text(label, style: const TextStyle(color: AppColors.muted)),
        ]),
      );
}

class ErrorMessage extends StatelessWidget {
  const ErrorMessage(this.message, {super.key, this.onRetry});
  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.error_outline, color: AppColors.danger, size: 32),
            const SizedBox(height: 10),
            Text(message, textAlign: TextAlign.center),
            if (onRetry != null) ...[
              const SizedBox(height: 14),
              OutlinedButton(onPressed: onRetry, child: const Text('ลองอีกครั้ง')),
            ],
          ]),
        ),
      );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.title, {super.key, this.action});
  final String title;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Expanded(child: Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800))),
          if (action != null) action!,
        ],
      );
}

class DeliveryProofCard extends StatelessWidget {
  const DeliveryProofCard({
    super.key,
    required this.fileName,
    required this.apiRoot,
  });

  final String fileName;
  final String apiRoot;

  @override
  Widget build(BuildContext context) {
    final root = apiRoot.endsWith('/')
        ? apiRoot.substring(0, apiRoot.length - 1)
        : apiRoot;
    final imageUrl =
        '$root/uploads/delivery-proofs/${Uri.encodeComponent(fileName)}';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.fact_check_outlined, color: AppColors.green),
                SizedBox(width: 8),
                Text(
                  'หลักฐานการจัดส่ง',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(
                imageUrl,
                width: double.infinity,
                height: 230,
                fit: BoxFit.contain,
                loadingBuilder: (context, child, progress) => progress == null
                    ? child
                    : const SizedBox(
                        height: 230,
                        child: Center(child: CircularProgressIndicator()),
                      ),
                errorBuilder: (context, error, stackTrace) => const SizedBox(
                  height: 150,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.broken_image_outlined, size: 32),
                        SizedBox(height: 6),
                        Text('ไม่สามารถโหลดรูปหลักฐานได้'),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
