#!/bin/bash

ENVIRONMENT=$1

# AWS command opts
TASK_FAMILY="$ENVIRONMENT-wt-read-api"
SERVICE_NAME="$ENVIRONMENT-wt-read-api"
AWS_REGION="eu-west-1"

# container setup options
LATEST_TAG=`git describe --abbrev=0 --tags`

# container startup options
WT_CONFIG=$ENVIRONMENT
ETH_NETWORK_PROVIDER_RESOLVED="${ENVIRONMENT^^}_ETH_NETWORK_PROVIDER"

TASK_DEF="[{\"portMappings\": [{\"hostPort\": 0,\"protocol\": \"tcp\",\"containerPort\": 3000}],
   \"logConfiguration\": {
      \"logDriver\": \"awslogs\",
      \"options\": {
        \"awslogs-group\": \"shared-docker-cluster-t3\",
        \"awslogs-region\": \"$AWS_REGION\",
        \"awslogs-stream-prefix\": \"$ENVIRONMENT-wt-read-api\"
      }
    },
    \"environment\": [
      {
        \"name\": \"ETH_NETWORK_PROVIDER\",
        \"value\": \"${!ETH_NETWORK_PROVIDER_RESOLVED}\"
      },
      {
        \"name\": \"BASE_URL\",
        \"value\": \"https://$ENVIRONMENT-api.windingtree.com\"
      },
      {
        \"name\": \"WT_CONFIG\",
        \"value\": \"$WT_CONFIG\"
      }
    ],
    \"image\": \"docker.io/windingtree/wt-read-api:$LATEST_TAG\",
    \"name\": \"wt-read-api\",
    \"memoryReservation\": 64,
    \"cpu\": 128
  }]"

echo $TASK_DEF

echo "Updating task definition"
aws ecs register-task-definition --region $AWS_REGION --family $TASK_FAMILY --container-definitions "$TASK_DEF" > /dev/null
echo "Updating service"
aws ecs update-service --region $AWS_REGION --cluster shared-docker-cluster-t3 --service "$SERVICE_NAME" --task-definition "$TASK_FAMILY" > /dev/null
