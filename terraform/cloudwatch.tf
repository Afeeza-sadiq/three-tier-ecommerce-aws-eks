resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${var.project_name}/cluster"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/eks/${var.project_name}/application"
  retention_in_days = 14
}

# Alarm example: notify when EKS node CPU is sustained high (extend with SNS topic as needed)
resource "aws_cloudwatch_metric_alarm" "node_cpu_high" {
  alarm_name          = "${var.project_name}-node-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "node_cpu_utilization"
  namespace           = "ContainerInsights"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggers when average EKS node CPU exceeds 80% for 15 minutes"
  dimensions = {
    ClusterName = aws_eks_cluster.main.name
  }
}
