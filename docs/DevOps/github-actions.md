
## Overview

GitHub Actions是一个CI/CD平台

## The components of GitHub Actions

### Workflows

Workflows定义在`.github/workflows`目录下

### Events

事件

### Jobs

任务，是流程中一系列步骤(steps)的集合

### Actions

An action is a custom application for the GitHub Actions platform that performs a complex but frequently repeated task.
Use an action to help reduce the amount of repetitive code that you write in your workflow files.

### Runners

Runner是运行Workflows的服务器。每一个Runner在同一时间只能运行一个Job。
GitHub提供了Ubuntu Linux，Microsoft Windows，MacOS的Runner来运行你的Workflow，并且每个Workflow将会在一个全新构建的虚拟机上运行。
