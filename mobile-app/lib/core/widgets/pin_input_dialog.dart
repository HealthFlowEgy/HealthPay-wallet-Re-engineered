import 'package:flutter/material.dart';
import 'package:healthpay/core/theme/app_colors.dart';
import 'package:healthpay/core/theme/app_typography.dart';

class PinInputDialog extends StatefulWidget {
  final String title;
  final String? subtitle;
  final Function(String) onComplete;
  final VoidCallback? onCancel;
  final int pinLength;

  const PinInputDialog({
    super.key,
    required this.title,
    this.subtitle,
    required this.onComplete,
    this.onCancel,
    this.pinLength = 4,
  });

  @override
  State<PinInputDialog> createState() => _PinInputDialogState();
}

class _PinInputDialogState extends State<PinInputDialog> {
  String _pin = '';
  String? _errorText;

  void _onKeyPressed(String key) {
    if (key == 'backspace') {
      if (_pin.isNotEmpty) {
        setState(() {
          _pin = _pin.substring(0, _pin.length - 1);
          _errorText = null;
        });
      }
    } else if (_pin.length < widget.pinLength) {
      setState(() {
        _pin += key;
        _errorText = null;
      });

      if (_pin.length == widget.pinLength) {
        widget.onComplete(_pin);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Close button
            Align(
              alignment: AlignmentDirectional.topEnd,
              child: IconButton(
                icon: const Icon(Icons.close),
                onPressed: () {
                  widget.onCancel?.call();
                  Navigator.pop(context);
                },
              ),
            ),
            
            // Title
            Text(widget.title, style: AppTypography.headline3),
            if (widget.subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                widget.subtitle!,
                style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ],
            
            const SizedBox(height: 24),
            
            // PIN dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(widget.pinLength, (index) {
                final isFilled = index < _pin.length;
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isFilled ? AppColors.primary : Colors.transparent,
                    border: Border.all(
                      color: _errorText != null ? AppColors.error : AppColors.primary,
                      width: 2,
                    ),
                  ),
                );
              }),
            ),
            
            // Error text
            if (_errorText != null) ...[
              const SizedBox(height: 8),
              Text(
                _errorText!,
                style: AppTypography.bodySmall.copyWith(color: AppColors.error),
              ),
            ],
            
            const SizedBox(height: 24),
            
            // Numeric keypad
            _buildKeypad(),
          ],
        ),
      ),
    );
  }

  Widget _buildKeypad() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: ['1', '2', '3'].map(_buildKey).toList(),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: ['4', '5', '6'].map(_buildKey).toList(),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: ['7', '8', '9'].map(_buildKey).toList(),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            const SizedBox(width: 64), // Empty space
            _buildKey('0'),
            _buildKey('backspace'),
          ],
        ),
      ],
    );
  }

  Widget _buildKey(String key) {
    final isBackspace = key == 'backspace';
    
    return InkWell(
      onTap: () => _onKeyPressed(key),
      borderRadius: BorderRadius.circular(32),
      child: Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isBackspace ? Colors.transparent : AppColors.surface,
        ),
        child: Center(
          child: isBackspace
              ? const Icon(Icons.backspace_outlined, size: 24)
              : Text(key, style: AppTypography.headline2),
        ),
      ),
    );
  }
}
